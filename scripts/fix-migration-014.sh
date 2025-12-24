#!/bin/bash
# Скрипт для исправления проблем после миграции 014

# Настройки подключения
DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

echo "🔧 Исправление проблем после миграции 014..."
echo ""

# SQL для исправления
SQL_FIX=$(cat <<'EOF'
-- Удаляем записи без group_slug (старые, неиспользуемые)
DELETE FROM subgroups 
WHERE group_slug IS NULL OR group_slug = '';

-- Проверяем результат
SELECT 
    'После исправления: записи без group_slug' as check_name,
    COUNT(*) as count
FROM subgroups 
WHERE group_slug IS NULL OR group_slug = '';

-- Показываем статистику по группам
SELECT 
    'Статистика по группам' as info,
    group_slug,
    COUNT(*) as subgroups_count
FROM subgroups
WHERE group_slug IS NOT NULL AND group_slug != ''
GROUP BY group_slug
ORDER BY group_slug;
EOF
)

# Выполняем исправление
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


