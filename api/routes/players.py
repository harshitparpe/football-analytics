"""
api/routes/players.py
----------------------
Blueprint: /api/players

Endpoints:
  GET /api/players/               → paginated list, filterable
  GET /api/players/<id>           → single player detail
  GET /api/players/top-scorers    → top N players by goals
  GET /api/players/penalty-takers → best penalty_skill shooters (for simulator)
  GET /api/players/keepers        → GKs with best save_skill (for simulator)
"""

from flask import Blueprint, jsonify, request
from api.models import Player
from api.schemas.schemas import player_schema, players_schema

players_bp = Blueprint('players', __name__)


@players_bp.get('/')
def get_players():
    """
    ?team_id=3      → filter by team
    ?position=FWD   → filter by position (GK/DEF/MID/FWD)
    ?page=1&per_page=20
    """
    page     = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    team_id  = request.args.get('team_id', type=int)
    position = request.args.get('position', None)

    query = Player.query.order_by(Player.goals.desc())

    if team_id:
        query = query.filter_by(team_id=team_id)
    if position:
        query = query.filter_by(position=position.upper())

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'players':  players_schema.dump(paginated.items),
        'total':    paginated.total,
        'pages':    paginated.pages,
        'page':     page,
        'per_page': per_page,
    })


@players_bp.get('/top-scorers')
def top_scorers():
    """
    GET /api/players/top-scorers?limit=10
    Top players ranked by total World Cup goals.
    Powers the 'Top Scorers' leaderboard on the dashboard.
    """
    limit   = request.args.get('limit', 10, type=int)
    limit   = min(limit, 50)   # cap at 50 to prevent abuse

    players = Player.query.filter(
        Player.goals > 0
    ).order_by(
        Player.goals.desc(),
        Player.appearances.asc()   # tiebreak: fewer games = more efficient
    ).limit(limit).all()

    return jsonify({'top_scorers': players_schema.dump(players)})


@players_bp.get('/penalty-takers')
def penalty_takers():
    limit   = request.args.get('limit', 50, type=int)
    players = Player.query.filter(
        Player.position.in_(['FWD', 'MID', 'DEF']),
        Player.penalty_skill >= 0.50,
        Player.appearances >= 2,
    ).order_by(Player.penalty_skill.desc()).limit(limit).all()
    return jsonify({'penalty_takers': players_schema.dump(players)})


@players_bp.get('/keepers')
def keepers():
    """
    GET /api/players/keepers?limit=20
    Returns GKs sorted by save_skill DESC.
    Used to populate the keeper dropdown in the penalty simulator.
    """
    limit   = request.args.get('limit', 20, type=int)
    players = Player.query.filter_by(
        position='GK'
    ).order_by(Player.save_skill.desc()).limit(limit).all()

    return jsonify({'keepers': players_schema.dump(players)})


@players_bp.get('/<int:player_id>')
def get_player(player_id):
    player = Player.query.get_or_404(player_id,
                description=f'Player {player_id} not found')
    return jsonify(player_schema.dump(player))