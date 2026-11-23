# Backup + migration 019 (cover_short / cover_large)
# Run from project root: .\scripts\run-migration-019.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
if (-not $root) { $root = (Get-Location).Path }
Set-Location $root

$backupDir = "backups"
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$backupDir/backup_before_migration_019_$ts.sql"
$migration = "database/migrations/019_covers_short_large.sql"

$dbHost = "mysql.35401aca832c.hosting.myjino.ru"
$dbPort = "3306"
$dbUser = "j35045845_biblio"
$dbPass = "tuhrih-zoqmYp"
$dbName = "j35045845_biblio"

if (-not (Test-Path $migration)) {
    Write-Error "Migration not found: $migration"
    exit 1
}

# 1. Backup
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Write-Host "1. Creating backup -> $backupFile"

if (Get-Command php -ErrorAction SilentlyContinue) {
    php scripts/backup-019.php
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} elseif (Get-Command mysqldump -ErrorAction SilentlyContinue) {
    & mysqldump -h $dbHost -P $dbPort -u $dbUser "-p$dbPass" `
        --single-transaction --routines --triggers `
        --default-character-set=utf8mb4 --no-tablespaces `
        $dbName | Set-Content -Path $backupFile -Encoding UTF8
    if (-not (Test-Path $backupFile) -or (Get-Item $backupFile).Length -eq 0) {
        Write-Error "Backup failed or empty"
        exit 1
    }
    Write-Host "   Backup OK: $backupFile"
} else {
    Write-Error "Need php or mysqldump. Install one, or run backup manually (see 019_README.md)."
    exit 1
}

# 2. Migration
Write-Host "2. Applying migration: $migration"
if (Get-Command mysql -ErrorAction SilentlyContinue) {
    Get-Content $migration -Raw | & mysql -h $dbHost -P $dbPort -u $dbUser "-p$dbPass" $dbName
    if ($LASTEXITCODE -ne 0) { Write-Error "Migration failed"; exit 1 }
    Write-Host "   Migration OK."
} else {
    Write-Host "   mysql not found. Run manually:"
    Write-Host "   mysql -h $dbHost -P $dbPort -u $dbUser -p $dbName < $migration"
    exit 1
}

Write-Host "Done."
