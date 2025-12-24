#!/bin/bash
# Скрипт для проверки результатов миграции 014

# Настройки подключения
DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

echo "🔍 Проверка результатов миграции 014..."
echo ""

# Создаём временный SQL файл для проверки
SQL_CHECK=$(cat <<'EOF'
-- Проверка 1: Все подгруппы должны иметь group_slug
SELECT 
    'Проверка 1: Подгруппы без group_slug' as check_name,
    COUNT(*) as count
FROM subgroups 
WHERE group_slug IS NULL;

-- Проверка 2: Все slug должны быть в формате group-subgroup
SELECT 
    'Проверка 2: Slug не в формате group-subgroup' as check_name,
    COUNT(*) as count
FROM subgroups 
WHERE slug NOT LIKE '%-%';

-- Проверка 3: Статистика по группам
SELECT 
    'Проверка 3: Статистика по группам' as check_name,
    group_slug,
    COUNT(*) as subgroups_count
FROM subgroups
GROUP BY group_slug
ORDER BY group_slug
LIMIT 10;

-- Проверка 4: Примеры новых slug
SELECT 
    'Проверка 4: Примеры новых slug' as check_name,
    slug,
    title_ru,
    group_slug,
    sort
FROM subgroups
ORDER BY group_slug, sort, title_ru
LIMIT 15;
EOF
)

# Выполняем проверку
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

echo ""
echo "✅ Проверка завершена!"


