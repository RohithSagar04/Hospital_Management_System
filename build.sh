#!/usr/bin/env bash
# ── Render Build Script for HMS Backend ─────────────────────────────────────
# This script runs automatically on every Render deploy.
# Render calls it from the project root directory.

set -o errexit  # Exit immediately on any error

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Collecting static files..."
python manage.py collectstatic --no-input

echo "==> Running database migrations..."
python manage.py migrate

echo "==> Build complete!"
