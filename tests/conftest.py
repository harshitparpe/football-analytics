"""
tests/conftest.py
-----------------
Pytest fixtures for the test suite.

Uses SQLite in-memory database for tests — fast, isolated,
no PostgreSQL dependency in CI. TestingConfig sets this up.
"""

import pytest
from api import create_app
from api.extensions import db as _db
from api.models.user import User


@pytest.fixture(scope='session')
def app():
    """Create a test Flask app using TestingConfig (SQLite in-memory)."""
    app = create_app('testing')
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture(scope='function')
def db(app):
    """
    Provide a clean DB session per test function.
    Rolls back after each test — tests are fully isolated.
    """
    with app.app_context():
        yield _db
        _db.session.rollback()


@pytest.fixture(scope='function')
def client(app):
    """Flask test client — makes HTTP requests without a running server."""
    return app.test_client()


@pytest.fixture(scope='function')
def auth_token(client):
    """Register a test user and return a valid JWT token."""
    client.post('/api/auth/register', json={
        'username': 'testuser',
        'email':    'test@example.com',
        'password': 'testpass123',
    })
    resp  = client.post('/api/auth/login', json={
        'email':    'test@example.com',
        'password': 'testpass123',
    })
    return resp.get_json()['access_token']


@pytest.fixture(scope='function')
def auth_headers(auth_token):
    """Authorization header dict — pass to client requests directly."""
    return {'Authorization': f'Bearer {auth_token}'}