# Миграции базы данных

## Общие правила применения миграций

См. [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md) для подробного чек-листа.

Детальные описания и чек-листы по отдельным миграциям лежат в подпапке [docs/](docs/). Полные правила безопасности миграций и разработки — [docs/SAFETY_AND_RULES.md](docs/SAFETY_AND_RULES.md).

## Быстрая инструкция

```bash
# 1. Создать бэкап
./scripts/create-backup-XXX.sh

# 2. Проверить ДО миграции
./scripts/check-migration-safety.sh before

# 3. Применить миграцию
./scripts/run-migration-XXX.sh

# 4. Скрипт автоматически проверит ПОСЛЕ и сравнит результаты
```

## Доступные миграции

В этой папке находятся SQL-файлы миграций (005–019). Подробные описания — в [docs/](docs/):

- **014** — [docs/014_README.md](docs/014_README.md), [docs/014_add_group_and_sort_to_subgroups.md](docs/014_add_group_and_sort_to_subgroups.md)
- **015** — [docs/015_README.md](docs/015_README.md), [docs/015_SAFETY_CHECK.md](docs/015_SAFETY_CHECK.md), [docs/015_BACKUP_INSTRUCTIONS.md](docs/015_BACKUP_INSTRUCTIONS.md), [docs/015_NEXT_STEPS.md](docs/015_NEXT_STEPS.md), [docs/015_SUMMARY.md](docs/015_SUMMARY.md)
- **016** — [docs/016_README.md](docs/016_README.md), [docs/016_SUMMARY.md](docs/016_SUMMARY.md), [docs/016_FINAL_CHECKLIST.md](docs/016_FINAL_CHECKLIST.md), [docs/MIGRATION_016_READY.md](docs/MIGRATION_016_READY.md), [docs/QUICK_START_016.md](docs/QUICK_START_016.md)
- **017** — [docs/MIGRATION_017_COMPLETED.md](docs/MIGRATION_017_COMPLETED.md)
- **019** — [docs/019_README.md](docs/019_README.md)

### Пример: миграция 015

**Файлы:**
- `015_change_subgroup_cascade_to_set_null.sql` — SQL миграция (в этой папке)
- [docs/015_README.md](docs/015_README.md) — подробное описание

**Скрипты:**
- `scripts/create-backup-015.sh` — создание бэкапа
- `scripts/run-migration-015.sh` — применение миграции (с проверками)

## Универсальные скрипты

### Проверка безопасности миграции

```bash
# Сохранить статистику ДО миграции
./scripts/check-migration-safety.sh before

# Сохранить статистику ПОСЛЕ миграции
./scripts/check-migration-safety.sh after

# Сравнить результаты
./scripts/check-migration-safety.sh compare
```

Скрипт проверяет:
- Количество записей в каждой таблице
- Размер бэкапа (опционально)

## Правила из [docs/SAFETY_AND_RULES.md](docs/SAFETY_AND_RULES.md)

- ✅ **Обязательно создавать бэкап** перед применением любой миграции
- ✅ **Проверять количество записей** до и после — должно быть идентично
- ✅ **Проверять размер бэкапа** — должен совпадать
- ❌ Если количество записей изменилось — откатить миграцию
