#!/bin/bash
# Простое восстановление таблицы data из бэкапа

DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

BACKUP_FILE="backups/backup_before_migration_014_20251218_230151.sql"

echo "🔄 Восстановление таблицы data из бэкапа..."
echo ""

# Создаём SQL для восстановления
SQL_RESTORE=$(cat <<'RESTORE_SQL'
SET FOREIGN_KEY_CHECKS = 0;

-- Очищаем таблицу data
TRUNCATE TABLE `data`;
RESTORE_SQL
)

# Извлекаем INSERT INTO data из бэкапа
INSERT_LINE=$(grep "INSERT INTO \`data\`" "$BACKUP_FILE")

if [ -z "$INSERT_LINE" ]; then
    echo "❌ INSERT INTO data не найден в бэкапе"
    exit 1
fi

# Добавляем INSERT в SQL
echo "$SQL_RESTORE" > /tmp/restore_data.sql
echo "$INSERT_LINE" >> /tmp/restore_data.sql
echo "SET FOREIGN_KEY_CHECKS = 1;" >> /tmp/restore_data.sql

echo "📤 Восстановление данных..."

# Выполняем восстановление
if command -v mysql &> /dev/null; then
    mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" < /tmp/restore_data.sql
    EXIT_CODE=$?
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    docker run --rm -i \
        mysql:8.0 \
        mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" < /tmp/restore_data.sql
    EXIT_CODE=$?
fi

rm -f /tmp/restore_data.sql

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Данные восстановлены!"
    echo ""
    echo "💡 Теперь нужно исправить миграцию и выполнить её заново"
else
    echo ""
    echo "❌ Ошибка при восстановлении (код: $EXIT_CODE)"
    exit $EXIT_CODE
fi


