#!/bin/bash
# Исправление subgroup_slug в таблице data

DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

echo "🔧 Исправление subgroup_slug в таблице data..."
echo ""

SQL_FIX=$(cat <<'FIX_SQL'
SET FOREIGN_KEY_CHECKS = 0;

-- Обновляем все записи в data: заменяем старые subgroup_slug на новые (group-subgroup)
UPDATE `data` d
SET d.subgroup_slug = CONCAT(d.group_slug, '-', d.subgroup_slug)
WHERE d.subgroup_slug IS NOT NULL 
  AND d.group_slug IS NOT NULL
  AND d.subgroup_slug NOT LIKE '%-%';

-- Проверяем результат
SELECT 
    'После исправления: записи со старыми slug' as check_name,
    COUNT(*) as count
FROM `data` 
WHERE subgroup_slug IS NOT NULL 
  AND subgroup_slug NOT LIKE '%-%';

SELECT 
    'Всего записей в data' as info,
    COUNT(*) as count
FROM `data`;

SET FOREIGN_KEY_CHECKS = 1;
FIX_SQL
)

if command -v mysql &> /dev/null; then
    echo "$SQL_FIX" | mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME"
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    echo "$SQL_FIX" | docker run --rm -i \
        mysql:8.0 \
        mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME"
fi

echo ""
echo "✅ Исправление завершено!"


