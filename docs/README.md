# Документация проекта Библиотечка

## Структура документации

### Основная документация
- **[README.md](../README.md)** - главная документация проекта
- **[Правила разработки и безопасность миграций](../database/migrations/docs/SAFETY_AND_RULES.md)** - методология и правила миграций БД
- **[История изменений](../сhangelog.md)** - changelog проекта

### Гайды и инструкции ([guides/](guides/))
- **[Локальная разработка](guides/LOCAL_DEV.md)** - настройка локального окружения
- **[IndexNow](guides/INDEXNOW.md)** — быстрая переиндексация в Яндексе и Bing через IndexNow
- **[Диагностика проблем](guides/DIAGNOSTICS.md)** - диагностика и решение типичных проблем
- **[Исправление API 404](guides/FIX_API_404.md)** - решение проблем с API эндпоинтами
- **[Проверка файлов на сервере](guides/CHECK_FILES_ON_SERVER.md)** - проверка структуры файлов

### Производительность ([performance/](performance/))
- **[Анализ проблем производительности](performance/PERFORMANCE_ISSUES_ANALYSIS.md)** - анализ и диагностика
- **[Оптимизации производительности](performance/PERFORMANCE_OPTIMIZATIONS.md)** - выполненные оптимизации и рекомендации

### База данных
- **[database/README.md](../database/README.md)** - основная документация по БД
- **[database/backup_restore.md](../database/backup_restore.md)** - инструкции по бекапу и восстановлению
- **[database/migrate_to_server.md](../database/migrate_to_server.md)** - миграция БД на сервер
- Другие гайды по БД: [database/docs/](../database/docs/)

### API
- **[api/README.md](../api/README.md)** - документация PHP API

## Архив ([archive/](archive/))

Устаревшие документы периода миграции:
- **CODE_MIGRATION_RULES.md** - правила миграции с JSON на MySQL (миграция завершена)
- **DOCUMENTATION_ANALYSIS.md** - анализ структуры документации
- EXECUTE_COMMAND.txt, EXECUTE_NOW.sh

Временные документы удалены:
- RESTORE_DATA.md, API_TEST_RESULTS.md, CODE_ANALYSIS.md
