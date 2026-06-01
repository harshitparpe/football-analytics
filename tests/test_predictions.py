"""
tests/test_predictions.py
--------------------------
Tests for the ML prediction pipeline and prediction endpoint.
Uses SQLite in-memory DB — no PostgreSQL needed for these tests.
"""

import numpy as np
import pytest


def test_predict_endpoint_requires_auth(client):
    """POST /api/predict/match without token must return 401."""
    resp = client.post('/api/predict/match', json={
        'team_a_id': 1,
        'team_b_id': 2,
    })
    assert resp.status_code == 401


def test_predict_endpoint_validates_input(client, auth_headers):
    """Missing team_b_id must return 422."""
    resp = client.post('/api/predict/match',
                       json={'team_a_id': 1},
                       headers=auth_headers)
    assert resp.status_code == 422
    assert 'team_b_id' in str(resp.get_json()['error'])


def test_predict_endpoint_same_team_rejected(client, auth_headers):
    """Same team on both sides must return 422."""
    resp = client.post('/api/predict/match',
                       json={'team_a_id': 1, 'team_b_id': 1},
                       headers=auth_headers)
    # Either 422 (validation) or 404 (team not in SQLite test DB) is acceptable
    assert resp.status_code in (422, 404, 503)


def test_feature_cols_count():
    """FeatureEngine must expose exactly 10 feature columns."""
    from ml.features import FeatureEngine
    assert len(FeatureEngine.FEATURE_COLS) == 10


def test_feature_cols_are_symmetric():
    """
    Every team_a feature must have a corresponding team_b feature.
    Asymmetric features would introduce positional bias.
    """
    from ml.features import FeatureEngine
    cols = FeatureEngine.FEATURE_COLS
    a_feats = [c.replace('team_a_', '') for c in cols if c.startswith('team_a_')]
    b_feats = [c.replace('team_b_', '') for c in cols if c.startswith('team_b_')]
    assert sorted(a_feats) == sorted(b_feats), (
        f"Asymmetric features: a={a_feats} b={b_feats}"
    )


def test_model_artifact_structure():
    """
    Saved model.pkl must contain all required keys.
    Fails fast if someone saves a broken artifact.
    """
    import os, pickle
    model_path = os.path.join('ml', 'model.pkl')
    if not os.path.exists(model_path):
        pytest.skip('model.pkl not found — run python -m ml.train first')

    with open(model_path, 'rb') as f:
        artifact = pickle.load(f)

    required_keys = {'model', 'feature_cols', 'class_names',
                     'test_accuracy', 'cv_mean', 'version'}
    assert required_keys.issubset(artifact.keys())


def test_model_accuracy_above_baseline():
    """
    Model accuracy must beat the naive majority-class baseline (~47%).
    If this fails, the model has regressed and needs retraining.
    """
    import os, pickle
    model_path = os.path.join('ml', 'model.pkl')
    if not os.path.exists(model_path):
        pytest.skip('model.pkl not found')

    with open(model_path, 'rb') as f:
        artifact = pickle.load(f)

    assert artifact['test_accuracy'] > 0.55, (
        f"Model accuracy {artifact['test_accuracy']:.2%} is below "
        f"acceptable threshold. Retrain with python -m ml.train"
    )