"""
api/routes/predictions.py
--------------------------
Blueprint: /api/predict

Endpoints:
  POST /api/predict/match     → predict outcome for two teams
  GET  /api/predict/info      → model metadata (accuracy, features, version)
"""

from flask import Blueprint, jsonify, request
from marshmallow import ValidationError
from api.schemas.schemas import predict_req_schema
from api.services.prediction_service import PredictionService
from flask_jwt_extended import jwt_required    # ← add import


predictions_bp = Blueprint('predictions', __name__)

@predictions_bp.post('/match')
@jwt_required()
def predict_match():
    """
    POST /api/predict/match
    Body: { "team_a_id": 1, "team_b_id": 7 }

    Validates input with Marshmallow, runs Random Forest prediction,
    persists result to predictions table, returns probability breakdown.
    """
    body = request.get_json(silent=True)
    if not body:
        return jsonify({'error': 'JSON body required'}), 400

    try:
        data = predict_req_schema.load(body)
    except ValidationError as e:
        return jsonify({'error': e.messages}), 422

    try:
        result = PredictionService.predict_match(
            data['team_a_id'],
            data['team_b_id']
        )
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 503

    return jsonify(result), 200


@predictions_bp.get('/info')
def model_info():
    """
    GET /api/predict/info
    Returns model version, accuracy, CV score, and feature list.
    Powers the 'Model Info' panel on the dashboard.
    """
    try:
        info = PredictionService.get_model_info()
        return jsonify(info)
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 503