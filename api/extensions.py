from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()

def get_or_404(model, ident, description=None):
    """
    SQLAlchemy 3.x compatible get_or_404.
    Use this instead of Model.query.get_or_404() if you hit errors.
    """
    from flask import abort
    obj = db.session.get(model, ident)
    if obj is None:
        abort(404, description=description or f'{model.__name__} not found')
    return obj