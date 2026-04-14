# ── Hospital Management System – Frontend Startup Script ────────────────────
# Run this script from the project root:  .\start-frontend.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Magenta
Write-Host "  Hospital Management System  –  React Frontend" -ForegroundColor Magenta
Write-Host "====================================================" -ForegroundColor Magenta
Write-Host ""

# Move into frontend directory
Set-Location -Path ".\frontend"

# Install dependencies if node_modules is missing
if (-not (Test-Path ".\node_modules")) {
    Write-Host "[1/2] Installing npm dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "[1/2] node_modules found – skipping install." -ForegroundColor Green
}

# Start Vite dev server
Write-Host "[2/2] Starting Vite dev server at http://localhost:5173/" -ForegroundColor Green
Write-Host ""
npm run dev
