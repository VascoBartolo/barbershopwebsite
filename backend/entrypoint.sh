#!/bin/sh
set -e

echo "[entrypoint] Waiting for database..."
until python -c "
import os, psycopg2
psycopg2.connect(os.environ.get('DATABASE_URL', 'postgresql://johnycutz:johnycutz@postgres:5432/johnycutz'))
" 2>/dev/null; do
  sleep 1
done

echo "[entrypoint] Initializing database schema..."
python -c "
from app import app, db
with app.app_context():
    db.create_all()
print('[entrypoint] Schema ready.')
"

exec gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 60 app:app
