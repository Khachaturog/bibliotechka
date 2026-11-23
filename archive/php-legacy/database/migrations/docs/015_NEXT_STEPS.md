# Следующие шаги для применения миграции 015

## ✅ Что уже сделано:

1. ✅ Создана миграция `015_change_subgroup_cascade_to_set_null.sql`
2. ✅ Обновлен `init.sql` с новыми настройками
3. ✅ Обновлена документация (README, CHANGELOG)
4. ✅ Проверена безопасность миграции (данные не удаляются)
5. ✅ Создан скрипт для бэкапа `scripts/create-backup-015.sh`
6. ✅ Создан скрипт для применения миграции `scripts/run-migration-015.sh`

## 📋 План действий:

### Шаг 1: Создать бэкап (ОБЯЗАТЕЛЬНО)

```bash
# Способ 1: Использовать скрипт
./scripts/create-backup-015.sh

# Способ 2: Вручную через mysqldump
mysqldump \
  -h mysql.35401aca832c.hosting.myjino.ru \
  -P 3306 \
  -u j35045845_biblio \
  -ptuhrih-zoqmYp \
  --single-transaction \
  --routines \
  --triggers \
  --default-character-set=utf8mb4 \
  --no-tablespaces \
  j35045845_biblio > backups/backup_before_migration_015_$(date +%Y%m%d_%H%M%S).sql
```

**Проверьте**, что файл создан и не пустой:
```bash
ls -lh backups/backup_before_migration_015_*.sql
```

### Шаг 2: Применить миграцию

```bash
# Способ 1: Использовать скрипт (с проверками)
./scripts/run-migration-015.sh

# Способ 2: Вручную через mysql
mysql \
  -h mysql.35401aca832c.hosting.myjino.ru \
  -P 3306 \
  -u j35045845_biblio \
  -ptuhrih-zoqmYp \
  j35045845_biblio < ../015_change_subgroup_cascade_to_set_null.sql
```

### Шаг 3: Проверить результат

После применения миграции проверьте внешние ключи:

```sql
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME,
    DELETE_RULE,
    UPDATE_RULE
FROM information_schema.KEY_COLUMN_USAGE kcu
JOIN information_schema.REFERENTIAL_CONSTRAINTS rc 
    ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME 
    AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
WHERE kcu.TABLE_SCHEMA = 'j35045845_biblio'
  AND kcu.TABLE_NAME IN ('data', 'subgroups')
  AND kcu.REFERENCED_TABLE_NAME IN ('groups', 'subgroups')
ORDER BY kcu.TABLE_NAME, kcu.CONSTRAINT_NAME;
```

**Ожидаемый результат:**
- `data_ibfk_1` (data.group_slug → groups.slug): `DELETE_RULE = 'SET NULL'`
- `data_ibfk_2` (data.subgroup_slug → subgroups.slug): `DELETE_RULE = 'SET NULL'`
- `fk_subgroups_group` (subgroups.group_slug → groups.slug): `DELETE_RULE = 'SET NULL'`

### Шаг 4: Проверить структуру таблиц

```sql
-- Проверить, что колонки разрешают NULL
SHOW CREATE TABLE data\G
SHOW CREATE TABLE subgroups\G
```

**Ожидаемый результат:**
- `data.group_slug` должна быть `DEFAULT NULL`
- `data.subgroup_slug` должна быть `DEFAULT NULL`
- `subgroups.group_slug` должна быть `DEFAULT NULL`

## 🔍 Проверка безопасности

Миграция **НЕ удаляет данные**, она только:
- ✅ Изменяет структуру (NOT NULL → NULL)
- ✅ Меняет поведение внешних ключей (CASCADE → SET NULL)

Все существующие записи останутся неизменными.

## 📚 Дополнительная информация

- [Описание миграции](015_README.md)
- [Инструкции по бэкапу](015_BACKUP_INSTRUCTIONS.md)
- [Проверка безопасности](015_SAFETY_CHECK.md)

