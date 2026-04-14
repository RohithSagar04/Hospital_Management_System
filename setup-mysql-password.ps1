# ── HMS – MySQL Password Reset + First-Run Setup ─────────────────────────────
# Run this if you've forgotten your MySQL root password.
# This script stops MySQL, resets the root password, then runs migrations.
# Run as Administrator.

$ErrorActionPreference = "Stop"
$MYSQL_BIN = "C:\Program Files\MySQL\MySQL Server 8.0\bin"
$MYSQLD    = "$MYSQL_BIN\mysqld.exe"
$MYSQL     = "$MYSQL_BIN\mysql.exe"
$MYSQLADMIN = "$MYSQL_BIN\mysqladmin.exe"
$DATA_DIR  = "C:\ProgramData\MySQL\MySQL Server 8.0\Data"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  HMS – MySQL Root Password Reset & Database Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Choose new password ───────────────────────────────────────────
$newPwdSecure  = Read-Host "Enter a NEW MySQL root password (you will use this from now on)" -AsSecureString
$newPwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($newPwdSecure))

# ── Step 2: Stop MySQL service ────────────────────────────────────────────
Write-Host "[1/6] Stopping MySQL80 service..." -ForegroundColor Yellow
Stop-Service -Name "MySQL80" -Force
Start-Sleep -Seconds 2
Write-Host "  Stopped." -ForegroundColor Green

# ── Step 3: Start mysqld with --skip-grant-tables ─────────────────────────
Write-Host "[2/6] Starting MySQL in safe mode (skip-grant-tables)..." -ForegroundColor Yellow
$safeProc = Start-Process -FilePath $MYSQLD `
    -ArgumentList "--skip-grant-tables --skip-networking --datadir=`"$DATA_DIR`"" `
    -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 4
Write-Host "  Safe mode started (PID $($safeProc.Id))." -ForegroundColor Green

# ── Step 4: Reset root password ───────────────────────────────────────────
Write-Host "[3/6] Resetting root password..." -ForegroundColor Yellow
$sql = @"
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$newPwd';
FLUSH PRIVILEGES;
"@
& $MYSQL -u root --connect-expired-password -e $sql 2>&1 | Out-Null
Write-Host "  Password reset to the value you entered." -ForegroundColor Green

# ── Step 5: Kill safe-mode mysqld and restart service ─────────────────────
Write-Host "[4/6] Restarting MySQL80 service..." -ForegroundColor Yellow
Stop-Process -Id $safeProc.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Start-Service -Name "MySQL80"
Start-Sleep -Seconds 3
Write-Host "  MySQL80 running normally." -ForegroundColor Green

# ── Step 6: Create hms_db and run migrations ──────────────────────────────
Write-Host "[5/6] Creating database hms_db..." -ForegroundColor Yellow
& $MYSQL -u root "-p$newPwd" -e "CREATE DATABASE IF NOT EXISTS hms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1

# Update .env
(Get-Content .env -Raw) -replace 'your_mysql_root_password_here', $newPwd |
    Set-Content .env -Encoding UTF8
Write-Host "  .env updated with new password." -ForegroundColor Green

Write-Host "[6/6] Running Django migrations..." -ForegroundColor Yellow
python manage.py migrate
Write-Host "  Migrations applied." -ForegroundColor Green

# ── Done ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "ALL DONE!" -ForegroundColor Green
Write-Host "  New MySQL root password : $newPwd"
Write-Host "  Database                : hms_db"
Write-Host ""
Write-Host "  Start backend  : .\start-backend.ps1" -ForegroundColor Cyan
Write-Host "  Start frontend : .\start-frontend.ps1" -ForegroundColor Cyan
Write-Host ""
