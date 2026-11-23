#!/bin/bash
# Откат изменений в таблице subgroups

DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

echo "🔄 Откат изменений в таблице subgroups..."
echo ""

SQL_ROLLBACK=$(cat <<'ROLLBACK_SQL'
SET FOREIGN_KEY_CHECKS = 0;

-- Удаляем колонки, добавленные миграцией
ALTER TABLE `subgroups` 
  DROP FOREIGN KEY IF EXISTS `fk_subgroups_group`,
  DROP INDEX IF EXISTS `idx_group_sort`,
  DROP INDEX IF EXISTS `idx_group_slug`,
  DROP COLUMN IF EXISTS `sort`,
  DROP COLUMN IF EXISTS `group_slug`;

-- Удаляем новые записи с форматом group-subgroup
DELETE FROM `subgroups` WHERE `slug` LIKE '%-%';

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Откат завершён' as status;
ROLLBACK_SQL
)

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
echo "✅ Откат завершён"


