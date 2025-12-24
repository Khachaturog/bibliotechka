#!/bin/bash
# Скрипт для выполнения миграции 014

# Настройки подключения
DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

MIGRATION_FILE="database/migrations/014_add_group_and_sort_to_subgroups.sql"

echo "🚀 Выполнение миграции 014..."
echo "База: ${DB_NAME}"
echo "Файл: ${MIGRATION_FILE}"
echo ""

# Проверяем существование файла миграции
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Ошибка: файл миграции не найден: ${MIGRATION_FILE}"
    exit 1
fi

# Проверяем, установлен ли mysql клиент
if command -v mysql &> /dev/null; then
    echo "✅ Используем mysql клиент из системы"
    mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" < "$MIGRATION_FILE"
    EXIT_CODE=$?
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    echo "✅ Используем mysql клиент через Docker"
    docker run --rm -i \
        -v "$(pwd):/workspace" \
        -w /workspace \
        mysql:8.0 \
        mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" < "$MIGRATION_FILE"
    EXIT_CODE=$?
else
    echo "❌ Ошибка: mysql клиент не найден и Docker недоступен"
    echo ""
    echo "Установите MySQL клиент:"
    echo "  macOS: brew install mysql-client"
    exit 1
fi

echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Миграция успешно выполнена!"
    echo ""
    echo "💡 Проверьте результаты:"
    echo "   mysql -h ${DB_HOST} -u ${DB_USER} -p ${DB_NAME}"
    echo "   SELECT COUNT(*) FROM subgroups WHERE group_slug IS NULL;"
    echo "   SELECT slug, group_slug, sort FROM subgroups LIMIT 10;"
else
    echo "❌ Ошибка при выполнении миграции (код: $EXIT_CODE)"
    echo ""
    echo "💡 Проверьте логи выше и при необходимости восстановите из бэкапа:"
    echo "   mysql -h ${DB_HOST} -u ${DB_USER} -p ${DB_NAME} < backups/backup_before_migration_014_*.sql"
    exit $EXIT_CODE
fi


