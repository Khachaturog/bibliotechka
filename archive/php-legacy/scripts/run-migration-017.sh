#!/bin/bash
# Скрипт для выполнения миграции 017 - Оптимизация производительности

# Настройки подключения
DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

MIGRATION_FILE="database/migrations/017_performance_optimization.sql"

echo "🚀 Выполнение миграции 017: Оптимизация производительности"
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
    echo ""
    echo "Или выполните вручную через phpMyAdmin:"
    echo "  1. Откройте phpMyAdmin"
    echo "  2. Выберите базу: ${DB_NAME}"
    echo "  3. Вкладка SQL"
    echo "  4. Скопируйте содержимое файла: ${MIGRATION_FILE}"
    echo "  5. Вставьте и выполните"
    exit 1
fi

echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Миграция успешно выполнена!"
    echo ""
    echo "📊 Добавленные индексы:"
    echo "  - idx_url_seo_yandex на таблице data"
    echo "  - idx_status_group на таблице data"
    echo ""
    echo "🚀 Запросы теперь работают значительно быстрее!"
else
    echo "❌ Ошибка при выполнении миграции (код: ${EXIT_CODE})"
    echo ""
    echo "💡 Возможные причины:"
    echo "  - Индексы уже существуют (это нормально, можно игнорировать)"
    echo "  - Проблемы с подключением к БД"
    exit 1
fi

