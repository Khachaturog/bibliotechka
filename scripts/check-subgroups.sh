#!/bin/bash
# Проверка состояния таблицы subgroups

DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

SQL_CHECK=$(cat <<'EOF'
SELECT 
    'Количество записей в subgroups' as info,
    COUNT(*) as count
FROM subgroups;

SELECT 
    'Примеры записей' as info,
    slug,
    title_ru,
    group_slug
FROM subgroups
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


