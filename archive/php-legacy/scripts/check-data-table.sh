#!/bin/bash
# Проверка состояния таблицы data

DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

SQL_CHECK=$(cat <<'EOF'
SELECT 
    'Количество записей в data' as check_name,
    COUNT(*) as count
FROM data;

SELECT 
    'Примеры записей' as info,
    slug,
    title,
    group_slug,
    subgroup_slug
FROM data
LIMIT 10;
EOF
)

if command -v mysql &> /dev/null; then
    echo "$SQL_CHECK" | mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME"
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    echo "$SQL_CHECK" | docker run --rm -i \
        mysql:8.0 \
        mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME"
fi

