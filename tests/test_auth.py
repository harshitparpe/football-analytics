"""
tests/test_auth.py
------------------
Tests for JWT authentication endpoints.
"""


def test_register_success(client):
    resp = client.post('/api/auth/register', json={
        'username': 'newuser',
        'email':    'newuser@example.com',
        'password': 'securepass123',
    })
    data = resp.get_json()

    assert resp.status_code == 201
    assert 'access_token' in data
    assert data['user']['username'] == 'newuser'
    assert data['user']['email'] == 'newuser@example.com'
    # Never return password in response
    assert 'password' not in data['user']
    assert 'password_hash' not in data['user']


def test_register_duplicate_email(client):
    payload = {
        'username': 'user1',
        'email':    'duplicate@example.com',
        'password': 'pass123456',
    }
    client.post('/api/auth/register', json=payload)

    # Second registration with same email
    resp = client.post('/api/auth/register', json={
        'username': 'user2',
        'email':    'duplicate@example.com',
        'password': 'pass123456',
    })
    assert resp.status_code == 409
    assert 'already registered' in resp.get_json()['error']


def test_login_success(client):
    client.post('/api/auth/register', json={
        'username': 'loginuser',
        'email':    'login@example.com',
        'password': 'loginpass123',
    })
    resp = client.post('/api/auth/login', json={
        'email':    'login@example.com',
        'password': 'loginpass123',
    })
    data = resp.get_json()

    assert resp.status_code == 200
    assert 'access_token' in data


def test_login_wrong_password(client):
    client.post('/api/auth/register', json={
        'username': 'wrongpass',
        'email':    'wrongpass@example.com',
        'password': 'correctpass123',
    })
    resp = client.post('/api/auth/login', json={
        'email':    'wrongpass@example.com',
        'password': 'wrongpassword',
    })
    assert resp.status_code == 401


def test_me_requires_auth(client):
    """GET /api/auth/me without token must return 401."""
    resp = client.get('/api/auth/me')
    assert resp.status_code == 401


def test_me_with_token(client, auth_headers):
    resp = client.get('/api/auth/me', headers=auth_headers)
    data = resp.get_json()

    assert resp.status_code == 200
    assert 'username' in data
    assert 'email' in data
    assert 'password_hash' not in data