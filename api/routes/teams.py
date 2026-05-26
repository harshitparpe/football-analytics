from flask import Blueprint, jsonify

teams_bp = Blueprint('teams', __name__)

@teams_bp.get('/')
def get_teams():
    return jsonify({'teams': [], 'message': 'Teams endpoint live'})