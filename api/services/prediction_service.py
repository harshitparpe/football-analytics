"""
api/services/prediction_service.py
------------------------------------
PredictionService: loads the trained model and runs live predictions.

Follows the same service-layer pattern as StatsService —
routes call this, never touch the model directly.
"""

import os
import pickle
import numpy as np
from api.extensions import db
from api.models import Team, Match, Prediction
from ml.features import FeatureEngine

import os

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    'ml',
    'model.pkl'
)


class PredictionService:
    """
    Singleton-style service: model loaded once at first call,
    then cached on the class for the lifetime of the process.
    """
    _artifact = None   # class-level cache

    @classmethod
    def _load_model(cls):
        if cls._artifact is None:
            if not os.path.exists(MODEL_PATH):
                raise FileNotFoundError(
                    'ml/model.pkl not found. Run: python -m ml.train'
                )
            with open(MODEL_PATH, 'rb') as f:
                cls._artifact = pickle.load(f)
        return cls._artifact

    @classmethod
    def predict_match(cls, team_a_id: int, team_b_id: int) -> dict:
        """
        Run a prediction for team_a vs team_b.
        Returns probability breakdown + favourite + model metadata.
        """
        artifact = cls._load_model()
        model    = artifact['model']

        team_a = db.session.get(Team, team_a_id)
        team_b = db.session.get(Team, team_b_id)

        if not team_a or not team_b:
            raise ValueError('One or both team IDs not found')

        # Build feature vector
        engine   = FeatureEngine(db.session)
        X        = engine.build_single_prediction(team_a_id, team_b_id)

        # Get probabilities for [team_a_wins, draw, team_b_wins]
        proba    = model.predict_proba(X)[0]

        # Map to class indices (model may not have all 3 classes in training)
        classes  = list(model.classes_)
        def prob_for(cls_idx):
            return float(proba[classes.index(cls_idx)]) if cls_idx in classes else 0.0

        prob_a    = round(prob_for(0), 4)
        prob_draw = round(prob_for(1), 4)
        prob_b    = round(prob_for(2), 4)

        # Normalise to sum to 1.0 (handles missing classes)
        total = prob_a + prob_draw + prob_b or 1
        prob_a    = round(prob_a    / total, 4)
        prob_draw = round(prob_draw / total, 4)
        prob_b    = round(1 - prob_a - prob_draw, 4)

        favourite_map = {
            prob_a:    team_a.name,
            prob_draw: 'Draw',
            prob_b:    team_b.name,
        }
        favourite = favourite_map[max(prob_a, prob_draw, prob_b)]

        # Persist prediction to DB (upsert pattern — overwrite if exists)
        existing = Prediction.query.filter_by(
            match_id=None
        ).first()   # ad-hoc predictions have no match_id

        prediction = Prediction(
            match_id      = None,
            prob_team_a   = prob_a,
            prob_team_b   = prob_b,
            prob_draw     = prob_draw,
            model_version = artifact['version'],
        )
        db.session.add(prediction)
        db.session.commit()

        return {
            'team_a': {
                'id':          team_a_id,
                'name':        team_a.name,
                'win_prob':    prob_a,
                'win_prob_pct':f'{prob_a*100:.1f}%',
            },
            'draw': {
                'prob':    prob_draw,
                'prob_pct':f'{prob_draw*100:.1f}%',
            },
            'team_b': {
                'id':          team_b_id,
                'name':        team_b.name,
                'win_prob':    prob_b,
                'win_prob_pct':f'{prob_b*100:.1f}%',
            },
            'favourite':       favourite,
            'model_version':   artifact['version'],
            'model_accuracy':  artifact['test_accuracy'],
            'prediction_id':   prediction.id,
        }

    @classmethod
    def get_model_info(cls) -> dict:
        """Returns model metadata — used by /api/predict/info endpoint."""
        artifact = cls._load_model()
        return {
            'version':       artifact['version'],
            'test_accuracy': artifact['test_accuracy'],
            'cv_mean':       artifact['cv_mean'],
            'cv_std':        artifact['cv_std'],
            'n_estimators':  artifact['n_estimators'],
            'features':      artifact['feature_cols'],
            'classes':       artifact['class_names'],
        }