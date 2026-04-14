# ── Hospital Management System – Backend Startup Script ─────────────────────
# Run this script from the project root:  .\start-backend.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Hospital Management System  –  Django Backend" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Activate virtual environment if it exists
if (Test-Path ".\.venv\Scripts\Activate.ps1") {
    Write-Host "[1/3] Activating virtual environment..." -ForegroundColor Yellow
    & .\.venv\Scripts\Activate.ps1
} else {
    Write-Host "[!] No .venv found. Using system Python." -ForegroundColor Red
}

# Apply any pending migrations
Write-Host "[2/3] Running database migrations..." -ForegroundColor Yellow
python manage.py migrate

# Start development server
Write-Host "[3/3] Starting Django server at http://127.0.0.1:8000/" -ForegroundColor Green
Write-Host ""
python manage.py runserver
