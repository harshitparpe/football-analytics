"""
api/routes/auth.py
-------------------
Blueprint: /api/auth
Full JWT implementation comes on Day 7.
Today: register + login stubs that return placeholder responses.
"""

from flask import Blueprint, jsonify, request

auth_bp = Blueprint('auth', __name__)


@auth_bp.post('/register')
def register():
    return jsonify({'message': 'Auth coming Day 7'}), 200


@auth_bp.post('/login')
def login():
    return jsonify({'message': 'Auth coming Day 7'}), 200