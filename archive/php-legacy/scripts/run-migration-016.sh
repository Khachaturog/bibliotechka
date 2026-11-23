#!/bin/bash
# Скрипт для выполнения миграции 016: Синхронизация card_authors с данными из Notion

set -e  # Остановка при ошибке

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATION_FILE="$PROJECT_ROOT/database/migrations/016_sync_card_authors_from_notion.sql"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Параметры подключения к БД
DB_HOST="${DB_HOST:-mysql.35401aca832c.hosting.myjino.ru}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-j35045845_biblio}"
DB_PASSWORD="${DB_PASSWORD:-tuhrih-zoqmYp}"
DB_NAME="${DB_NAME:-j35045845_biblio}"

echo "=========================================="
echo "Миграция 016: Синхронизация card_authors"
echo "=========================================="
echo ""

# Проверка наличия файла миграции
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Ошибка: файл миграции не найден: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Файл миграции: $MIGRATION_FILE"
echo ""

# Создание резервной копии
echo "📦 Создание резервной копии..."
BACKUP_FILE="$BACKUP_DIR/backup_card_authors_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p "$BACKUP_DIR"

if command -v mysql &> /dev/null; then
    mysqldump \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" \
        card_authors > "$BACKUP_FILE" 2>/dev/null || {
        echo "⚠️  Предупреждение: не удалось создать резервную копию через mysqldump"
        echo "   Продолжаем без резервной копии..."
        BACKUP_FILE=""
    }
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    # Для локальной разработки с Docker
    docker exec bibliotechka-mysql mysqldump -uroot -proot bibliotechka card_authors > "$BACKUP_FILE" 2>/dev/null || {
        echo "⚠️  Предупреждение: не удалось создать резервную копию"
        BACKUP_FILE=""
    }
else
    echo "⚠️  Предупреждение: не найден mysql клиент или docker"
    echo "   Рекомендуется создать резервную копию вручную перед выполнением миграции!"
    read -p "Продолжить без резервной копии? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Отменено пользователем"
        exit 1
    fi
    BACKUP_FILE=""
fi

if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
    echo "✅ Резервная копия создана: $BACKUP_FILE"
    echo ""
fi

# Проверка текущего состояния
echo "🔍 Проверка текущего состояния..."
if command -v mysql &> /dev/null; then
    CURRENT_COUNT=$(mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" \
        -sN -e "SELECT COUNT(*) FROM card_authors;" 2>/dev/null || echo "0")
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    CURRENT_COUNT=$(docker exec bibliotechka-mysql mysql -uroot -proot bibliotechka -sN -e "SELECT COUNT(*) FROM card_authors;" 2>/dev/null || echo "0")
else
    CURRENT_COUNT="?"
fi

echo "   Текущее количество записей: $CURRENT_COUNT"
echo "   Ожидаемое после миграции: 723"
echo ""

# Подтверждение
read -p "Выполнить миграцию? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено пользователем"
    exit 0
fi

# Выполнение миграции
echo ""
echo "🚀 Выполнение миграции..."
echo ""

if command -v mysql &> /dev/null; then
    mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" < "$MIGRATION_FILE"
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    docker exec -i bibliotechka-mysql mysql -uroot -proot bibliotechka < "$MIGRATION_FILE"
else
    echo "❌ Ошибка: не найден mysql клиент или docker"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Миграция выполнена успешно!"
    echo ""
    
    # Проверка результата
    echo "🔍 Проверка результата..."
    if command -v mysql &> /dev/null; then
        NEW_COUNT=$(mysql \
            -h "$DB_HOST" \
            -P "$DB_PORT" \
            -u "$DB_USER" \
            -p"$DB_PASSWORD" \
            "$DB_NAME" \
            -sN -e "SELECT COUNT(*) FROM card_authors;" 2>/dev/null || echo "0")
    elif command -v docker &> /dev/null && docker ps &> /dev/null; then
        NEW_COUNT=$(docker exec bibliotechka-mysql mysql -uroot -proot bibliotechka -sN -e "SELECT COUNT(*) FROM card_authors;" 2>/dev/null || echo "0")
    else
        NEW_COUNT="?"
    fi
    
    echo "   Количество записей после миграции: $NEW_COUNT"
    echo ""
    
    if [ "$NEW_COUNT" = "723" ]; then
        echo "✅ Отлично! Все записи синхронизированы."
    elif [ "$NEW_COUNT" != "?" ]; then
        echo "⚠️  Количество записей ($NEW_COUNT) не соответствует ожидаемому (723)"
        echo "   Проверьте логи миграции выше"
    fi
    
    if [ -n "$BACKUP_FILE" ]; then
        echo ""
        echo "💾 Резервная копия сохранена: $BACKUP_FILE"
    fi
else
    echo ""
    echo "❌ Ошибка при выполнении миграции!"
    if [ -n "$BACKUP_FILE" ]; then
        echo "   Резервная копия: $BACKUP_FILE"
        echo "   Для отката выполните: mysql < $BACKUP_FILE"
    fi
    exit 1
fi

