#!/bin/sh

set -e

echo "Running database migrations..."
flask --app run:app db upgrade

echo "Starting Flask application..."
exec python run.py
