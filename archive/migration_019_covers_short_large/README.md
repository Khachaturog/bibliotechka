# Архив: миграция 019 (cover_short / cover_large)

Пакет файлов для бэкапа и применения миграции 019. Сохранён на будущее.

## Содержимое

| Файл | Назначение |
|------|------------|
| `019_covers_short_large.sql` | Миграция: добавление cover_short/cover_large, удаление cover и cover_notion |
| `019_README.md` | Описание миграции и инструкция по запуску |
| `create-backup-019.sh` | Бэкап через bash (mysqldump или Docker) |
| `backup-019.php` | Бэкап через PHP (использует api/config.php) |
| `run-migration-019.ps1` | PowerShell: бэкап + миграция |

## Как использовать

1. **Скопировать в проект** (если ещё не на месте):
   - `019_covers_short_large.sql` → `database/migrations/`
   - `019_README.md` → `database/migrations/`
   - `create-backup-019.sh`, `backup-019.php`, `run-migration-019.ps1` → `scripts/`

2. **Запустить** из корня проекта:
   - Либо `.\scripts\run-migration-019.ps1` (PowerShell)
   - Либо вручную: сначала бэкап (`php scripts/backup-019.php` или `bash scripts/create-backup-019.sh`), затем  
     `mysql -h ... -u ... -p DB < database/migrations/019_covers_short_large.sql`

3. Подробности — в `019_README.md`.

## Требования

- PHP и/или MySQL-клиент (mysql, mysqldump) в PATH
- Доступ к БД (хост, пользователь, пароль — в скриптах и 019_README)
