"""
api/routes/auth.py
-------------------
Blueprint: /api/auth

Endpoints:
  POST /api/auth/register   → create account, return JWT
  POST /api/auth/login      → verify credentials, return JWT
  GET  /api/auth/me         → return current user (protected)
  POST /api/auth/logout     → client-side token discard (stateless JWT)

JWT strategy:
  - Tokens are stateless (no server-side session store)
  - Access token expires in 1 hour
  - Identity stored in token is user.id (int)
  - Protected routes use @jwt_required() decorator
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from marshmallow import Schema, fields, ValidationError, validate

from api.extensions import db
from api.models.user import User

auth_bp = Blueprint('auth', __name__)


# ── Request schemas (defined inline — small enough to not need schemas.py) ───

class RegisterSchema(Schema):
    username = fields.Str(required=True,
                          validate=validate.Length(min=3, max=80))
    email    = fields.Email(required=True)
    password = fields.Str(required=True,
                          validate=validate.Length(min=6))

class LoginSchema(Schema):
    email    = fields.Email(required=True)
    password = fields.Str(required=True)

register_schema = RegisterSchema()
login_schema    = LoginSchema()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@auth_bp.post('/register')
def register():
    """
    POST /api/auth/register
    Body: { "username": "...", "email": "...", "password": "..." }
    Returns JWT access token on success.
    """
    body = request.get_json(silent=True)
    if not body:
        return jsonify({'error': 'JSON body required'}), 400

    try:
        data = register_schema.load(body)
    except ValidationError as e:
        return jsonify({'error': e.messages}), 422

    # Check uniqueness
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 409

    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))

    return jsonify({
        'message': 'Account created successfully',
        'access_token': token,
        'user': {
            'id':       user.id,
            'username': user.username,
            'email':    user.email,
        }
    }), 201


@auth_bp.post('/login')
def login():
    """
    POST /api/auth/login
    Body: { "email": "...", "password": "..." }
    Returns JWT access token on success.
    """
    body = request.get_json(silent=True)
    if not body:
        return jsonify({'error': 'JSON body required'}), 400

    try:
        data = login_schema.load(body)
    except ValidationError as e:
        return jsonify({'error': e.messages}), 422

    user = User.query.filter_by(email=data['email']).first()

    # Deliberate: same error for wrong email OR wrong password
    # (prevents user enumeration attacks)
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = create_access_token(identity=str(user.id))

    return jsonify({
        'access_token': token,
        'user': {
            'id':       user.id,
            'username': user.username,
            'email':    user.email,
        }
    }), 200


@auth_bp.get('/me')
@jwt_required()
def me():
    """
    GET /api/auth/me
    Header: Authorization: Bearer <token>
    Returns current user info. Protected route — requires valid JWT.
    """
    user_id = get_jwt_identity()
    user    = db.session.get(User, user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'id':         user.id,
        'username':   user.username,
        'email':      user.email,
        'created_at': user.created_at.isoformat(),
        'is_active':  user.is_active,
    }), 200


@auth_bp.post('/logout')
@jwt_required()
def logout():
    """
    POST /api/auth/logout
    JWT is stateless — logout is handled client-side by discarding the token.
    This endpoint exists for API completeness and frontend clarity.
    """
    return jsonify({'message': 'Logged out. Discard your token client-side.'}), 200