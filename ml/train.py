"""
ml/train.py
-----------
Train the match outcome prediction model and save it to ml/model.pkl.

Run from project root:
    python -m ml.train

Model choice: Random Forest
Reasons (know these for interviews):
  - Handles small/medium tabular datasets well (916 matches is not large)
  - Naturally outputs class probabilities via predict_proba()
  - Resistant to overfitting via bagging
  - Feature importances are human-readable — good for dashboard display
  - No feature scaling required (unlike SVM or logistic regression)
"""

import sys
import os
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import create_app
from api.extensions import db
from ml.features import FeatureEngine

# Label names for the 3 classes
CLASS_NAMES = ['team_a_wins', 'draw', 'team_b_wins']
MODEL_PATH  = os.path.join(os.path.dirname(__file__), 'model.pkl')


def train():
    print('\n[ML] Starting training pipeline...')

    app = create_app()
    with app.app_context():

        # ── 1. Build feature matrix ───────────────────────────────────────────
        engine = FeatureEngine(db.session)
        X, y   = engine.build_training_data()

        # ── 2. Train / test split ─────────────────────────────────────────────
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=0.2,
            random_state=42,
            stratify=y       # preserve class balance in both splits
        )
        print(f'\n  Train size: {len(X_train)}  |  Test size: {len(X_test)}')
        print(f'  Class distribution (train): '
              f'{dict(zip(*np.unique(y_train, return_counts=True)))}')

        # ── 3. Train Random Forest ────────────────────────────────────────────
        model = RandomForestClassifier(
            n_estimators=200,     # 200 trees — good bias/variance tradeoff
            max_depth=8,          # prevent overfitting on small dataset
            min_samples_split=5,  # each split needs at least 5 samples
            min_samples_leaf=2,
            class_weight='balanced',  # handles draw-class imbalance
            random_state=42,
        )
        model.fit(X_train, y_train)

        # ── 4. Evaluate ───────────────────────────────────────────────────────
        y_pred    = model.predict(X_test)
        test_acc  = accuracy_score(y_test, y_pred)

        cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')

        print(f'\n  Test accuracy:      {test_acc:.4f}  ({test_acc*100:.1f}%)')
        print(f'  CV accuracy (5-fold): {cv_scores.mean():.4f} '
              f'± {cv_scores.std():.4f}')
        print(f'\n  Classification report:')
        print(classification_report(y_test, y_pred,
                                    target_names=CLASS_NAMES,
                                    zero_division=0))

        # ── 5. Feature importances ────────────────────────────────────────────
        importances = dict(zip(
            FeatureEngine.FEATURE_COLS,
            model.feature_importances_.round(4)
        ))
        print('  Feature importances:')
        for feat, imp in sorted(importances.items(),
                                key=lambda x: x[1], reverse=True):
            bar = '█' * int(imp * 40)
            print(f'    {feat:<30} {imp:.4f}  {bar}')

        # ── 6. Save model + metadata ──────────────────────────────────────────
        artifact = {
            'model':        model,
            'feature_cols': FeatureEngine.FEATURE_COLS,
            'class_names':  CLASS_NAMES,
            'test_accuracy':round(test_acc, 4),
            'cv_mean':      round(cv_scores.mean(), 4),
            'cv_std':       round(cv_scores.std(), 4),
            'n_estimators': model.n_estimators,
            'version':      'v1.0',
        }

        with open(MODEL_PATH, 'wb') as f:
            pickle.dump(artifact, f)

        print(f'\n[ML] ✓ Model saved to {MODEL_PATH}')
        print(f'[ML] ✓ Training complete. '
              f'Accuracy: {test_acc*100:.1f}%  |  CV: {cv_scores.mean()*100:.1f}%')

        return artifact


if __name__ == '__main__':
    train()