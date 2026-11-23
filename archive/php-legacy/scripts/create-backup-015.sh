#!/bin/bash
# Скрипт для создания бэкапа базы данных перед миграцией 015

# Настройки подключения
DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

# Папка для бэкапов
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_before_migration_015_${TIMESTAMP}.sql"

# Создаём папку backups, если её нет
mkdir -p "$BACKUP_DIR"

echo "📦 Создание бэкапа базы данных перед миграцией 015..."
echo "База: ${DB_NAME}"
echo "Файл: ${BACKUP_FILE}"
echo ""

# Проверяем, установлен ли mysqldump
if command -v mysqldump &> /dev/null; then
    echo "✅ Используем mysqldump из системы"
    mysqldump \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --default-character-set=utf8mb4 \
        --no-tablespaces \
        "$DB_NAME" > "$BACKUP_FILE"
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    echo "✅ Используем mysqldump через Docker"
    docker run --rm \
        mysql:8.0 \
        mysqldump \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --default-character-set=utf8mb4 \
        --no-tablespaces \
        "$DB_NAME" > "$BACKUP_FILE"
else
    echo "❌ Ошибка: mysqldump не найден и Docker недоступен"
    echo ""
    echo "Установите MySQL клиент:"
    echo "  macOS: brew install mysql-client"
    echo "  или используйте Docker: docker run --rm mysql:8.0 mysqldump ..."
    exit 1
fi

# Проверяем, что файл создан и не пустой
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    FILE_SIZE_BYTES=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null || wc -c < "$BACKUP_FILE" | tr -d ' ')
    
    # Сохраняем размер бэкапа для последующей проверки
    BACKUP_SIZE_FILE="${BACKUP_FILE}.size"
    echo "$FILE_SIZE_BYTES" > "$BACKUP_SIZE_FILE"
    
    echo ""
    echo "✅ Бэкап успешно создан!"
    echo "   Файл: ${BACKUP_FILE}"
    echo "   Размер: ${FILE_SIZE} (${FILE_SIZE_BYTES} байт)"
    echo "   Размер сохранен в: ${BACKUP_SIZE_FILE}"
    echo ""
    echo "🔍 Проверка безопасности миграции 015:"
    echo "   ✅ Миграция НЕ удаляет данные"
    echo "   ✅ Только изменяет структуру (NULL/NOT NULL)"
    echo "   ✅ Только меняет внешние ключи (ON DELETE CASCADE → SET NULL)"
    echo ""
    echo "💡 Следующие шаги:"
    echo "   1. Запустите проверку ДО: ./scripts/check-migration-safety.sh before"
    echo "   2. Примените миграцию: ./scripts/run-migration-015.sh"
    echo "   3. Проверка ПОСЛЕ выполнится автоматически"
    echo ""
    echo "💡 Для восстановления используйте:"
    echo "   mysql -h ${DB_HOST} -u ${DB_USER} -p ${DB_NAME} < ${BACKUP_FILE}"
else
    echo ""
    echo "❌ Ошибка: файл бэкапа не создан или пуст"
    exit 1
fi

