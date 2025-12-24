#!/bin/bash
# Полное восстановление subgroups: откат структуры + восстановление данных

DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

BACKUP_FILE="backups/backup_before_migration_014_20251218_230151.sql"

echo "🔄 Полное восстановление таблицы subgroups..."
echo ""

# Шаг 1: Откатываем структуру таблицы
SQL_ROLLBACK=$(cat <<'ROLLBACK_SQL'
SET FOREIGN_KEY_CHECKS = 0;

-- Удаляем внешние ключи и индексы
ALTER TABLE `subgroups` 
  DROP FOREIGN KEY IF EXISTS `fk_subgroups_group`,
  DROP INDEX IF EXISTS `idx_group_sort`,
  DROP INDEX IF EXISTS `idx_group_slug`;

-- Удаляем колонки, добавленные миграцией
ALTER TABLE `subgroups` 
  DROP COLUMN IF EXISTS `sort`,
  DROP COLUMN IF EXISTS `group_slug`;

SET FOREIGN_KEY_CHECKS = 1;
ROLLBACK_SQL
)

# Шаг 2: Восстанавливаем данные
INSERT_LINE=$(grep "INSERT INTO \`subgroups\`" "$BACKUP_FILE")

if [ -z "$INSERT_LINE" ]; then
    echo "❌ INSERT INTO subgroups не найден в бэкапе"
    exit 1
fi

# Создаём полный SQL для восстановления
SQL_RESTORE=$(cat <<RESTORE_SQL
SET FOREIGN_KEY_CHECKS = 0;

-- Очищаем таблицу
TRUNCATE TABLE \`subgroups\`;

-- Восстанавливаем данные
$INSERT_LINE

SET FOREIGN_KEY_CHECKS = 1;
RESTORE_SQL
)

echo "📤 Откат структуры..."
if command -v mysql &> /dev/null; then
    echo "$SQL_ROLLBACK" | mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME"
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    echo "$SQL_ROLLBACK" | docker run --rm -i \
        mysql:8.0 \
        mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME"
fi

echo ""
echo "📤 Восстановление данных..."
if command -v mysql &> /dev/null; then
    echo "$SQL_RESTORE" | mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME"
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    echo "$SQL_RESTORE" | docker run --rm -i \
        mysql:8.0 \
        mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME"
fi

echo ""
echo "✅ Восстановление завершено!"


