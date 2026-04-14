# ── Hospital Management System – One-Time Database Setup ────────────────────
# Run ONCE after cloning the project:  .\setup-database.ps1
# You will be prompted for your MySQL root password.

$ErrorActionPreference = "Stop"
$MYSQL = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  HMS – MySQL Database Setup" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Get MySQL credentials ─────────────────────────────────────────
$mysqlUser = Read-Host "MySQL username (default: root)"
if ([string]::IsNullOrWhiteSpace($mysqlUser)) { $mysqlUser = "root" }

$mysqlPwdSecure = Read-Host "MySQL password" -AsSecureString
$mysqlPwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPwdSecure)
)

# ── Step 2: Create database ───────────────────────────────────────────────
Write-Host ""
Write-Host "[1/4] Creating database 'hms_db'..." -ForegroundColor Yellow

$sql = "CREATE DATABASE IF NOT EXISTS hms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
& $MYSQL -u $mysqlUser -p"$mysqlPwd" -e $sql 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Could not connect to MySQL. Check your credentials." -ForegroundColor Red
    exit 1
}
Write-Host "  Database 'hms_db' is ready." -ForegroundColor Green

# ── Step 3: Write .env ────────────────────────────────────────────────────
Write-Host "[2/4] Writing .env file..." -ForegroundColor Yellow

$envContent = @"
# Hospital Management System – Environment Variables

# Django
SECRET_KEY=django-insecure--83q`$wlxzztel+ul*oqsov9um%n(q1`$j&bd3jt5uu7qac`$=n6w
DEBUG=True

# MySQL Database
DB_ENGINE=django.db.backends.mysql
DB_NAME=hms_db
DB_USER=$mysqlUser
DB_PASSWORD=$mysqlPwd
DB_HOST=localhost
DB_PORT=3306
"@

$envContent | Set-Content -Path ".env" -Encoding UTF8
Write-Host "  .env file written." -ForegroundColor Green

# ── Step 4: Run Django migrations ─────────────────────────────────────────
Write-Host "[3/4] Running Django migrations..." -ForegroundColor Yellow
python manage.py makemigrations
python manage.py migrate
Write-Host "  Migrations applied." -ForegroundColor Green

# ── Done ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[4/4] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Start backend  :  .\start-backend.ps1" -ForegroundColor Cyan
Write-Host "  Start frontend :  .\start-frontend.ps1" -ForegroundColor Cyan
Write-Host ""
