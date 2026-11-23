# Запуск PHP API сервера (Windows)
# Требуется PHP 8.0+ в PATH (XAMPP, Laragon, php.net)
# **Windows:** `.ps1` (PowerShell), например `start-api.ps1`
#
# В PowerShell (из корня проекта):
#   .\start-api.ps1
#
# Или вручную:
#   php -S 0.0.0.0:8000 -t . router.php

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Запуск PHP API сервера..." -ForegroundColor Green
Write-Host "Локально: http://localhost:8000" -ForegroundColor Cyan
Write-Host "С телефона (та же Wi-Fi): http://<ваш-IP>:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Остановка: Ctrl+C" -ForegroundColor Yellow
Write-Host ""

php -S 0.0.0.0:8000 -t . router.php
