# Инструкция по созданию бэкапа перед миграцией 015

## ✅ Проверка безопасности миграции

**ВСЕ ОПЕРАЦИИ БЕЗОПАСНЫ** - миграция НЕ удаляет данные:
- ✅ Только изменяет структуру (NULL/NOT NULL)
- ✅ Только меняет внешние ключи (CASCADE → SET NULL)
- ❌ НЕТ DELETE, DROP TABLE, TRUNCATE
- ❌ НЕТ UPDATE с обнулением существующих данных

## Создание бэкапа

### Способ 1: Использовать скрипт (если установлен mysqldump)

```bash
./scripts/create-backup-015.sh
```

### Способ 2: Вручную через mysqldump

```bash
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

### Способ 3: Через Docker (если mysqldump недоступен локально)

```bash
docker run --rm \
  mysql:8.0 \
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

### Способ 4: Через phpMyAdmin или другой графический инструмент

1. Откройте phpMyAdmin или ваш Database Client
2. Выберите базу данных `j35045845_biblio`
3. Экспортируйте всю базу данных
4. Сохраните в `backups/backup_before_migration_015_YYYYMMDD_HHMMSS.sql`

## Проверка бэкапа

После создания бэкапа проверьте, что файл создан и не пустой:

```bash
ls -lh backups/backup_before_migration_015_*.sql
```

Файл должен иметь размер больше 0 байт.

## Что изменяет миграция 015

1. **Таблица `data`**:
   - `group_slug`: NOT NULL → NULL (данные остаются)
   - `subgroup_slug`: NOT NULL → NULL (данные остаются)
   - Внешние ключи: ON DELETE CASCADE → ON DELETE SET NULL

2. **Таблица `subgroups`**:
   - `group_slug`: NOT NULL → NULL (данные остаются)
   - Внешний ключ: ON DELETE CASCADE → ON DELETE SET NULL

**Важно:** Все существующие данные останутся неизменными. Миграция меняет только структуру и поведение при будущих удалениях.

