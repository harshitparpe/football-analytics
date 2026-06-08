from api import create_app

app = create_app()

if __name__ == '__main__':
    import os
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=5000, debug=debug)