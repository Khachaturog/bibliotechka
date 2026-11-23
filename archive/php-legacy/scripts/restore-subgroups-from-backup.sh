#!/bin/bash
# Восстановление таблицы subgroups из бэкапа

DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

BACKUP_FILE="backups/backup_before_migration_014_20251218_230151.sql"

echo "🔄 Восстановление таблицы subgroups из бэкапа..."
echo ""

# Извлекаем INSERT INTO subgroups из бэкапа
INSERT_LINE=$(grep "INSERT INTO \`subgroups\`" "$BACKUP_FILE")

if [ -z "$INSERT_LINE" ]; then
    echo "❌ INSERT INTO subgroups не найден в бэкапе"
    exit 1
fi

# Создаём SQL для восстановления
SQL_RESTORE=$(cat <<'RESTORE_SQL'
SET FOREIGN_KEY_CHECKS = 0;

-- Очищаем таблицу subgroups
TRUNCATE TABLE `subgroups`;

RESTORE_SQL
)

# Добавляем INSERT из бэкапа
echo "$SQL_RESTORE" > /tmp/restore_subgroups.sql
echo "$INSERT_LINE" >> /tmp/restore_subgroups.sql
echo "SET FOREIGN_KEY_CHECKS = 1;" >> /tmp/restore_subgroups.sql

echo "📤 Восстановление данных..."

# Выполняем восстановление
if command -v mysql &> /dev/null; then
    mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" < /tmp/restore_subgroups.sql
    EXIT_CODE=$?
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    docker run --rm -i \
        mysql:8.0 \
        mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" < /tmp/restore_subgroups.sql
    EXIT_CODE=$?
fi

rm -f /tmp/restore_subgroups.sql

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Данные subgroups восстановлены!"
else
    echo ""
    echo "❌ Ошибка при восстановлении (код: $EXIT_CODE)"
    exit $EXIT_CODE
fi


