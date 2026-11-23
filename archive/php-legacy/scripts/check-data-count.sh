#!/bin/bash
# Проверка количества записей в таблице data

DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

SQL_CHECK=$(cat <<'EOF'
SELECT 
    'Текущее количество записей в data' as info,
    COUNT(*) as count
FROM data;

SELECT 
    'Записи по группам' as info,
    group_slug,
    COUNT(*) as count
FROM data
GROUP BY group_slug
ORDER BY group_slug;
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


