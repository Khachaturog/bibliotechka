# Скрипт для отправки изменений на GitHub
# Запуск: .\scripts\push-to-github.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "🔄 Проверка статуса Git..." -ForegroundColor Cyan

# Проверка блокировки
if (Test-Path .git\index.lock) {
    Write-Host "❌ Git заблокирован. Закройте VS Code/Cursor и попробуйте снова." -ForegroundColor Red
    exit 1
}

# Удаляем node_modules и backups из индекса (если они там есть)
Write-Host "🧹 Очистка индекса от node_modules и backups..." -ForegroundColor Yellow
git reset HEAD node_modules 2>&1 | Out-Null
git reset HEAD backups 2>&1 | Out-Null

# Добавляем только нужные файлы
Write-Host "📦 Добавление изменений..." -ForegroundColor Cyan
git add .gitignore
git add README.md
git add api/
git add database/
git add js/
git add scripts/
git add archive/
git add docs/
git add start-api.ps1

# Проверяем, что node_modules не добавлены
$status = git status --short
$hasNodeModules = $status | Select-String -Pattern "node_modules"
if ($hasNodeModules) {
    Write-Host "⚠️  Предупреждение: node_modules все еще в индексе. Удаляем..." -ForegroundColor Yellow
    git reset HEAD node_modules 2>&1 | Out-Null
}

# Показываем статус
Write-Host "`n📋 Статус изменений:" -ForegroundColor Cyan
git status --short | Select-Object -First 20

# Создаем коммит
Write-Host "`n💾 Создание коммита..." -ForegroundColor Cyan
$commitMessage = "Уборка проекта: обновлен .gitignore, удалены временные файлы, миграция 019"
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Коммит создан успешно!" -ForegroundColor Green
    
    # Отправляем на GitHub
    Write-Host "`n🚀 Отправка на GitHub..." -ForegroundColor Cyan
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Изменения успешно отправлены на GitHub!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Ошибка при отправке на GitHub" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`n❌ Ошибка при создании коммита" -ForegroundColor Red
    exit 1
}
