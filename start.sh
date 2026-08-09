#!/bin/sh

echo "Running database migrations..."
flask db upgrade

echo "Starting Flask application..."
python run.py
