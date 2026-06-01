"""
api/routes/penalty.py
----------------------
Blueprint: /api/penalty

Endpoints:
  POST /api/penalty/simulate     → single penalty kick simulation
  POST /api/penalty/shootout     → full 5-kick shootout simulation
  GET  /api/penalty/players      → returns shooter + keeper options in one call
"""

from flask import Blueprint, jsonify, request
from marshmallow import ValidationError

from api.models import Player
from api.schemas.schemas import penalty_req_schema
from api.services.penalty_service import Shooter, Keeper, PenaltyEngine
from flask_jwt_extended import jwt_required    # ← add import

penalty_bp = Blueprint('penalty', __name__)


def _build_shooter(player: Player) -> Shooter:
    """Build a Shooter from a Player ORM object."""
    return Shooter(
        player_id     = player.id,
        name          = player.name,
        penalty_skill = player.penalty_skill or 0.5,
    )


def _build_keeper(player: Player) -> Keeper:
    """Build a Keeper from a Player ORM object."""
    return Keeper(
        player_id  = player.id,
        name       = player.name,
        save_skill = player.save_skill or 0.5,
    )


@penalty_bp.post('/simulate')
@jwt_required()
def simulate_penalty():
    """
    POST /api/penalty/simulate
    Body: { "shooter_id": 42, "keeper_id": 17 }

    Simulates a single penalty kick.
    Returns outcome, probabilities, directions, and a narrative reason string.
    """
    body = request.get_json(silent=True)
    if not body:
        return jsonify({'error': 'JSON body required'}), 400

    try:
        data = penalty_req_schema.load(body)
    except ValidationError as e:
        return jsonify({'error': e.messages}), 422

    shooter_player = Player.query.get(data['shooter_id'])
    keeper_player  = Player.query.get(data['keeper_id'])

    if not shooter_player:
        return jsonify({'error': f"Shooter ID {data['shooter_id']} not found"}), 404
    if not keeper_player:
        return jsonify({'error': f"Keeper ID {data['keeper_id']} not found"}), 404
    if keeper_player.position != 'GK':
        return jsonify({'error': 'keeper_id must be a GK position player'}), 422

    shooter = _build_shooter(shooter_player)
    keeper  = _build_keeper(keeper_player)
    engine  = PenaltyEngine(shooter, keeper)
    outcome = engine.simulate()

    return jsonify({
        'scored':          outcome.scored,
        'shot_direction':  outcome.shot_direction,
        'shot_height':     outcome.shot_height,
        'keeper_dived':    outcome.keeper_dived,
        'score_prob':      outcome.score_prob,
        'save_prob':       outcome.save_prob,
        'reason':          outcome.reason,
        'shooter': {
            'id':    shooter_player.id,
            'name':  shooter_player.name,
            'team':  shooter_player.team.name,
            'skill': outcome.shooter_skill,
        },
        'keeper': {
            'id':    keeper_player.id,
            'name':  keeper_player.name,
            'team':  keeper_player.team.name,
            'skill': outcome.keeper_skill,
        },
    }), 200


@penalty_bp.post('/shootout')
@jwt_required()
def simulate_shootout():
    body = request.get_json(silent=True)
    if not body:
        return jsonify({'error': 'JSON body required'}), 400

    try:
        data = penalty_req_schema.load(body)
    except ValidationError as e:
        return jsonify({'error': e.messages}), 422

    kicks = min(data.get('kicks', 5), 10)   # ← from validated data, not raw body
    
    shooter_player = Player.query.get(data['shooter_id'])
    keeper_player  = Player.query.get(data['keeper_id'])

    if not shooter_player:
        return jsonify({'error': f"Shooter {data['shooter_id']} not found"}), 404
    if not keeper_player:
        return jsonify({'error': f"Keeper {data['keeper_id']} not found"}), 404

    engine = PenaltyEngine(_build_shooter(shooter_player),
                           _build_keeper(keeper_player))
    result = engine.simulate_shootout(n_kicks=kicks)

    return jsonify({
        **result,
        'shooter': {'id': shooter_player.id, 'name': shooter_player.name,
                    'skill': shooter_player.penalty_skill},
        'keeper':  {'id': keeper_player.id,  'name': keeper_player.name,
                    'skill': keeper_player.save_skill},
    }), 200


@penalty_bp.get('/players')
def penalty_players():
    """
    GET /api/penalty/players?shooters=15&keepers=10

    Returns top shooters and keepers in a single call.
    Saves the frontend from making two separate requests.
    """
    n_shooters = min(request.args.get('shooters', 20, type=int), 50)
    n_keepers  = min(request.args.get('keepers',  15, type=int), 30)

    shooters = Player.query.filter(
        Player.position.in_(['FWD', 'MID']),
        Player.penalty_skill >= 0.60,
    ).order_by(Player.penalty_skill.desc()).limit(n_shooters).all()

    keepers = Player.query.filter_by(
        position='GK'
    ).order_by(Player.save_skill.desc()).limit(n_keepers).all()

    def fmt(p):
        return {
            'id':           p.id,
            'name':         p.name,
            'team':         p.team.name if p.team else None,
            'position':     p.position,
            'penalty_skill':round(p.penalty_skill, 3),
            'save_skill':   round(p.save_skill, 3),
            'goals':        p.goals,
        }

    return jsonify({
        'shooters': [fmt(p) for p in shooters],
        'keepers':  [fmt(p) for p in keepers],
    })