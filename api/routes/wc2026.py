"""
api/routes/wc2026.py
----------------------
Blueprint: /api/wc2026

Endpoints:
  GET  /api/wc2026/fixtures        -> all fixtures grouped by stage
  GET  /api/wc2026/standings       -> group standings table
  GET  /api/wc2026/summary         -> overall accuracy stats
  POST /api/wc2026/result          -> record actual result (protected)
  POST /api/wc2026/knockout-teams  -> set knockout fixture teams (protected)
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from marshmallow import Schema, fields, ValidationError

from api.models import WC2026Fixture
from api.services.wc2026_service import WC2026Service

wc2026_bp = Blueprint('wc2026', __name__)


def _fmt_fixture(f: WC2026Fixture) -> dict:
    return {
        'match_number': f.match_number,
        'stage':        f.stage,
        'round_name':   f.round_name,
        'group_name':   f.group_name,
        'team_a':       f.team_a_name,
        'team_b':       f.team_b_name,
        'team_a_id':    f.team_a_id,
        'team_b_id':    f.team_b_id,
        'prediction': {
            'team_a_prob': f.pred_team_a_prob,
            'draw_prob':   f.pred_draw_prob,
            'team_b_prob': f.pred_team_b_prob,
            'winner':      f.predicted_winner,
        } if f.predicted_winner else None,
        'actual': {
            'score_a': f.actual_score_a,
            'score_b': f.actual_score_b,
            'winner':  f.actual_winner,
        } if f.is_played else None,
        'is_played': f.is_played,
        'prediction_correct': f.prediction_correct,
        'feeds_from_a': f.feeds_from_a,
        'feeds_from_b': f.feeds_from_b,
    }


@wc2026_bp.get('/fixtures')
def get_fixtures():
    """
    GET /api/wc2026/fixtures
    Returns all 104 fixtures grouped by stage.
    """
    by_stage = WC2026Service.get_all_fixtures()

    return jsonify({
        stage: [_fmt_fixture(f) for f in fixtures]
        for stage, fixtures in by_stage.items()
    })


@wc2026_bp.get('/standings')
def get_standings():
    """
    GET /api/wc2026/standings
    Returns group standings (P/W/D/L/Pts/GD) computed from played matches.
    """
    standings = WC2026Service.get_group_standings()
    return jsonify({'standings': standings})


@wc2026_bp.get('/summary')
def get_summary():
    """
    GET /api/wc2026/summary
    Returns overall prediction accuracy: played, predicted, correct, accuracy.
    """
    return jsonify(WC2026Service.get_accuracy_summary())


class ResultSchema(Schema):
    match_number = fields.Int(required=True)
    score_a      = fields.Int(required=True)
    score_b      = fields.Int(required=True)

result_schema = ResultSchema()


@wc2026_bp.post('/result')
@jwt_required()
def record_result():
    """
    POST /api/wc2026/result
    Body: { "match_number": 1, "score_a": 2, "score_b": 1 }
    Records the actual result and marks prediction as correct/incorrect.
    """
    body = request.get_json(silent=True)
    if not body:
        return jsonify({'error': 'JSON body required'}), 400

    try:
        data = result_schema.load(body)
    except ValidationError as e:
        return jsonify({'error': e.messages}), 422

    try:
        result = WC2026Service.record_result(
            data['match_number'], data['score_a'], data['score_b']
        )
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404


class KnockoutTeamsSchema(Schema):
    match_number = fields.Int(required=True)
    team_a_name  = fields.Str(required=False, allow_none=True)
    team_b_name  = fields.Str(required=False, allow_none=True)

knockout_schema = KnockoutTeamsSchema()


@wc2026_bp.post('/knockout-teams')
@jwt_required()
def set_knockout_teams():
    """
    POST /api/wc2026/knockout-teams
    Body: { "match_number": 73, "team_a_name": "Brazil", "team_b_name": "France" }
    Sets the teams for a knockout fixture once they're determined,
    and auto-generates the ML prediction.
    """
    body = request.get_json(silent=True)
    if not body:
        return jsonify({'error': 'JSON body required'}), 400

    try:
        data = knockout_schema.load(body)
    except ValidationError as e:
        return jsonify({'error': e.messages}), 422

    try:
        result = WC2026Service.update_knockout_teams(
            data['match_number'],
            data.get('team_a_name'),
            data.get('team_b_name'),
        )
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404