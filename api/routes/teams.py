"""
api/routes/teams.py
--------------------
Blueprint: /api/teams

Endpoints:
  GET  /api/teams/                    → paginated list of all teams
  GET  /api/teams/<id>                → team detail with computed stats
  GET  /api/teams/<id>/stats          → win/draw/loss record from StatsService
  GET  /api/teams/<id>/matches        → match history (paginated)
  GET  /api/teams/head-to-head?a=&b=  → head-to-head between two teams
"""

from flask import Blueprint, jsonify, request
from api.extensions import get_or_404
from api.models import Team, Match
from api.schemas.schemas import teams_schema, team_detail_schema, matches_schema
from api.services.stats_service import StatsService

teams_bp = Blueprint('teams', __name__)


@teams_bp.get('/')
def get_teams():
    """
    Returns all teams, optionally filtered by confederation.
    ?confederation=UEFA  →  filter by confederation
    ?page=1&per_page=20  →  pagination
    """
    page       = request.args.get('page', 1, type=int)
    per_page   = request.args.get('per_page', 20, type=int)
    conf       = request.args.get('confederation', None)

    query = Team.query.order_by(Team.name)
    if conf:
        query = query.filter_by(confederation=conf.upper())

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'teams':    teams_schema.dump(paginated.items),
        'total':    paginated.total,
        'pages':    paginated.pages,
        'page':     page,
        'per_page': per_page,
    })


@teams_bp.get('/<int:team_id>')
def get_team(team_id):
    """Single team with ORM-computed win_percentage and total_matches."""
    team = get_or_404(Team, team_id, description=f'Team {team_id} not found')
    return jsonify(team_detail_schema.dump(team))


@teams_bp.get('/<int:team_id>/stats')
def get_team_stats(team_id):
    """
    Full analytical record: wins, draws, losses, goals, win %.
    Powered by StatsService.get_team_record() — uses ORM aggregation.
    """
    stats = StatsService.get_team_record(team_id)
    return jsonify(stats)


@teams_bp.get('/<int:team_id>/matches')
def get_team_matches(team_id):
    """
    All historical matches for a team (home or away).
    ?year=2018  →  filter by World Cup year
    ?stage=Final  →  filter by stage
    """
    get_or_404(Team, team_id)

    year  = request.args.get('year', type=int)
    stage = request.args.get('stage', None)

    query = Match.query.filter(
        (Match.team_a_id == team_id) | (Match.team_b_id == team_id)
    ).order_by(Match.year.desc())

    if year:
        query = query.filter_by(year=year)
    if stage:
        query = query.filter(Match.stage.ilike(f'%{stage}%'))

    page     = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'matches':  matches_schema.dump(paginated.items),
        'total':    paginated.total,
        'pages':    paginated.pages,
        'page':     page,
    })


@teams_bp.get('/head-to-head')
def head_to_head():
    """
    GET /api/teams/head-to-head?a=<id>&b=<id>
    Returns all historical meetings + summary record.
    """
    a_id = request.args.get('a', type=int)
    b_id = request.args.get('b', type=int)

    if not a_id or not b_id:
        return jsonify({'error': 'Both ?a=<team_id> and ?b=<team_id> are required'}), 400
    if a_id == b_id:
        return jsonify({'error': 'team IDs must be different'}), 400

    result = StatsService.get_head_to_head(a_id, b_id)
    return jsonify(result)


@teams_bp.get('/confederations')
def get_confederations():
    """Utility endpoint — returns distinct confederation values. Used by frontend dropdowns."""
    from sqlalchemy import distinct
    confs = [r[0] for r in Team.query.with_entities(
        distinct(Team.confederation)).order_by(Team.confederation).all()]
    return jsonify({'confederations': confs})

@teams_bp.get('/tournament-averages')
def tournament_averages():
    """
    GET /api/teams/tournament-averages
    GET /api/teams/tournament-averages?year=2018
    """
    year = request.args.get('year', type=int)
    data = StatsService.get_tournament_averages(year=year)
    return jsonify(data)