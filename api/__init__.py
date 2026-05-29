from flask import Flask, jsonify
from api.config import config_map
from api.extensions import db, migrate, jwt, cors
import os

def create_app(env=None):
    app = Flask(__name__)

    env = env or os.environ.get('FLASK_ENV', 'development')
    app.config.from_object(config_map[env])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Import models so Flask-Migrate can detect them
    # from api.models import team, player, match, match_stat, prediction  # noqa
    import api.models.team
    import api.models.player
    import api.models.match
    import api.models.match_stat
    import api.models.prediction

    # Register Blueprints
    from api.routes.teams import teams_bp
    # from api.routes.players import players_bp
    # from api.routes.auth import auth_bp

    # Register Blueprints
    from api.routes.teams import teams_bp
    from api.routes.players import players_bp
    from api.routes.auth import auth_bp

    app.register_blueprint(teams_bp,   url_prefix='/api/teams')
    app.register_blueprint(players_bp, url_prefix='/api/players')
    app.register_blueprint(auth_bp,    url_prefix='/api/auth')

    @app.get('/health')
    def health():
        return {'status': 'ok', 'env': env}
    
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': str(e)}), 404

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'error': str(e)}), 400

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    return app