"""
api/models/user.py
------------------
User model for JWT authentication.
Passwords are hashed with werkzeug — never stored in plaintext.
"""

from api.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone

class User(db.Model):
    __tablename__ = 'users'

    id           = db.Column(db.Integer, primary_key=True)
    username     = db.Column(db.String(80),  nullable=False, unique=True)
    email        = db.Column(db.String(150), nullable=False, unique=True)
    password_hash= db.Column(db.String(256), nullable=False)
    created_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    is_active    = db.Column(db.Boolean, default=True)

    def set_password(self, password: str):
        """Hash and store password. Never store plaintext."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify a plaintext password against the stored hash."""
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'