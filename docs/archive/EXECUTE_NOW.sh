#!/bin/bash
# Выполнение миграции 016: Синхронизация card_authors
# Просто запустите этот скрипт: ./EXECUTE_NOW.sh

echo "🚀 Выполнение миграции 016..."
echo ""

MIGRATION_FILE="database/migrations/016_sync_with_backup.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Ошибка: файл миграции не найден: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Файл: $MIGRATION_FILE"
echo ""

# Параметры подключения
DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

echo "🔌 Подключение к БД..."
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo ""

# Пробуем выполнить через mysql клиент
if command -v mysql &> /dev/null; then
    echo "✅ Найден mysql клиент, выполняю миграцию..."
    echo ""
    
    mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" \
        < "$MIGRATION_FILE"
    
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo ""
        echo "✅ Миграция выполнена успешно!"
        echo ""
        echo "🔍 Проверка результата..."
        mysql \
            -h "$DB_HOST" \
            -P "$DB_PORT" \
            -u "$DB_USER" \
            -p"$DB_PASSWORD" \
            "$DB_NAME" \
            -e "SELECT COUNT(*) as 'Записей в card_authors' FROM card_authors; SELECT COUNT(*) as 'Записей в бэкапе' FROM card_authors_backup_20251223;"
    else
        echo ""
        echo "❌ Ошибка при выполнении миграции (код: $EXIT_CODE)"
        exit 1
    fi
    
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    echo "✅ Найден Docker, выполняю через контейнер..."
    echo ""
    
    docker run --rm -i \
        mysql:8.0 \
        mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" \
        < "$MIGRATION_FILE"
    
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo ""
        echo "✅ Миграция выполнена успешно!"
    else
        echo ""
        echo "❌ Ошибка при выполнении миграции (код: $EXIT_CODE)"
        exit 1
    fi
    
else
    echo "⚠️  MySQL клиент не найден в системе."
    echo ""
    echo "Выполните миграцию одним из способов:"
    echo ""
    echo "1. Через phpMyAdmin:"
    echo "   - Откройте phpMyAdmin"
    echo "   - Выберите базу j35045845_biblio"
    echo "   - Вкладка SQL"
    echo "   - Скопируйте содержимое файла: $MIGRATION_FILE"
    echo "   - Вставьте и выполните"
    echo ""
    echo "2. Через SSH на сервере:"
    echo "   mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME < $MIGRATION_FILE"
    echo ""
    echo "3. Установите MySQL клиент:"
    echo "   macOS: brew install mysql-client"
    echo ""
    echo "📄 Файл миграции: $MIGRATION_FILE"
    exit 0
fi

