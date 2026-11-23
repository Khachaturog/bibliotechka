#!/bin/bash
# Восстановление таблицы data из бэкапа

DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

BACKUP_FILE="backups/backup_before_migration_014_20251218_230151.sql"

echo "🔄 Восстановление таблицы data из бэкапа..."
echo "Файл: ${BACKUP_FILE}"
echo ""

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Файл бэкапа не найден: ${BACKUP_FILE}"
    exit 1
fi

# Создаём SQL для восстановления только таблицы data
# Извлекаем только INSERT INTO `data` из бэкапа
echo "📦 Извлечение данных из бэкапа..."

# Создаём временный SQL файл
TEMP_SQL=$(mktemp)

# Извлекаем структуру таблицы и данные
grep -A 1000000 "INSERT INTO \`data\`" "$BACKUP_FILE" | head -1 > "$TEMP_SQL"

# Добавляем команды для очистки и восстановления
cat > "$TEMP_SQL" << 'RESTORE_SQL'
SET FOREIGN_KEY_CHECKS = 0;

-- Очищаем таблицу data
TRUNCATE TABLE `data`;

RESTORE_SQL

# Добавляем INSERT из бэкапа
grep "INSERT INTO \`data\`" "$BACKUP_FILE" >> "$TEMP_SQL"

# Добавляем включение проверки внешних ключей
echo "SET FOREIGN_KEY_CHECKS = 1;" >> "$TEMP_SQL"

echo "📤 Восстановление данных..."

# Выполняем восстановление
if command -v mysql &> /dev/null; then
    mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" < "$TEMP_SQL"
    EXIT_CODE=$?
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    docker run --rm -i \
        -v "$(pwd):/workspace" \
        -w /workspace \
        mysql:8.0 \
        mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" < "$TEMP_SQL"
    EXIT_CODE=$?
fi

# Удаляем временный файл
rm -f "$TEMP_SQL"

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Данные восстановлены!"
    echo ""
    echo "💡 Теперь нужно заново выполнить миграцию 014, но с исправленной логикой"
else
    echo ""
    echo "❌ Ошибка при восстановлении (код: $EXIT_CODE)"
    exit $EXIT_CODE
fi


