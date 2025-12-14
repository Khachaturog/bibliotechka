#!/bin/bash

# Скрипт для переноса базы данных на сервер
# 
# Использование:
# 1. Отредактируйте настройки ниже
# 2. chmod +x scripts/migrate-db-to-server.sh
# 3. ./scripts/migrate-db-to-server.sh

set -e  # Остановить при ошибке

# ============================================
# НАСТРОЙКИ ЛОКАЛЬНОЙ БАЗЫ ДАННЫХ
# ============================================
LOCAL_DB_USER="bibliotechka_user"
LOCAL_DB_PASS="user_password_change_me"
LOCAL_DB_NAME="bibliotechka"
LOCAL_CONTAINER="bibliotechka-mysql"

# ============================================
# НАСТРОЙКИ СЕРВЕРА
# ============================================
SERVER_HOST="j35045845.hosting.myjino.ru"  # Адрес сервера для SSH (возможно нужен другой)
SERVER_USER="j35045845"                     # SSH пользователь
SERVER_DB_USER="j35045845_biblio"           # Пользователь MySQL на сервере
SERVER_DB_NAME="j35045845_biblio"           # Имя базы данных на сервере (обычно совпадает с логином)
SERVER_DB_PASS="tuhrih-zoqmYp"              # Пароль MySQL
SERVER_MYSQL_HOST="mysql.35401aca832c.hosting.myjino.ru"  # Адрес MySQL для прямого подключения

# ============================================
# ОПЦИИ
# ============================================
COMPRESS=true                             # Сжимать ли файл при передаче
BACKUP_DIR="./backups"                    # Папка для временных бэкапов
USE_SSH=true                              # Использовать SSH (false = прямое подключение к MySQL)

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Проверка настроек
if [ "$USE_SSH" = true ] && [ "$SERVER_HOST" == "your-server.com" ]; then
    error "Пожалуйста, настройте параметры SERVER_* в скрипте!"
fi

# Создаем папку для бэкапов
mkdir -p "$BACKUP_DIR"

# Генерируем имя файла
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_for_server_$TIMESTAMP.sql"

if [ "$COMPRESS" = true ]; then
    BACKUP_FILE="$BACKUP_FILE.gz"
fi

info "📦 Создание бэкапа локальной базы данных..."

# Создаем бэкап
if [ "$COMPRESS" = true ]; then
    docker exec "$LOCAL_CONTAINER" mysqldump \
        -u "$LOCAL_DB_USER" \
        -p"$LOCAL_DB_PASS" \
        --no-tablespaces \
        --default-character-set=utf8mb4 \
        --single-transaction \
        "$LOCAL_DB_NAME" | gzip > "$BACKUP_FILE"
else
    docker exec "$LOCAL_CONTAINER" mysqldump \
        -u "$LOCAL_DB_USER" \
        -p"$LOCAL_DB_PASS" \
        --no-tablespaces \
        --default-character-set=utf8mb4 \
        --single-transaction \
        "$LOCAL_DB_NAME" > "$BACKUP_FILE"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    error "Не удалось создать бэкап!"
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
info "✅ Бэкап создан: $BACKUP_FILE ($BACKUP_SIZE)"

# Запрашиваем пароль для MySQL на сервере, если не указан
if [ -z "$SERVER_DB_PASS" ]; then
    read -sp "Введите пароль для MySQL пользователя '$SERVER_DB_USER' на сервере: " SERVER_DB_PASS
    echo
fi

if [ "$USE_SSH" = true ]; then
    # ============================================
    # СПОСОБ 1: ЧЕРЕЗ SSH
    # ============================================
    info "📤 Загрузка бэкапа на сервер через SSH..."
    
    # Загружаем файл на сервер
    scp "$BACKUP_FILE" "$SERVER_USER@$SERVER_HOST:/tmp/" || {
        error "Не удалось загрузить файл на сервер!"
    }
    
    REMOTE_FILE="/tmp/$(basename $BACKUP_FILE)"
    info "✅ Файл загружен на сервер: $REMOTE_FILE"
    
    info "📥 Импорт базы данных на сервере..."
    
    # Импортируем на сервере
    if [ "$COMPRESS" = true ]; then
        ssh "$SERVER_USER@$SERVER_HOST" \
            "gunzip < $REMOTE_FILE | mysql -u $SERVER_DB_USER -p'$SERVER_DB_PASS' $SERVER_DB_NAME && rm $REMOTE_FILE" || {
            error "Не удалось импортировать базу данных на сервере!"
        }
    else
        ssh "$SERVER_USER@$SERVER_HOST" \
            "mysql -u $SERVER_DB_USER -p'$SERVER_DB_PASS' $SERVER_DB_NAME < $REMOTE_FILE && rm $REMOTE_FILE" || {
            error "Не удалось импортировать базу данных на сервере!"
        }
    fi
    
    info "✅ База данных импортирована на сервере"
    
    # Проверяем количество записей
    info "📊 Проверка данных на сервере..."
    ssh "$SERVER_USER@$SERVER_HOST" \
        "mysql -u $SERVER_DB_USER -p'$SERVER_DB_PASS' $SERVER_DB_NAME -e \"
        SELECT 
            'groups' as table_name, COUNT(*) as count FROM \\\`groups\\\`
        UNION ALL
        SELECT 'subgroups', COUNT(*) FROM subgroups
        UNION ALL
        SELECT 'data', COUNT(*) FROM data
        UNION ALL
        SELECT 'authors', COUNT(*) FROM authors
        UNION ALL
        SELECT 'card_authors', COUNT(*) FROM card_authors
        UNION ALL
        SELECT 'versions', COUNT(*) FROM versions;
        \"" || {
        warn "Не удалось проверить данные на сервере"
    }
else
    # ============================================
    # СПОСОБ 2: ПРЯМОЕ ПОДКЛЮЧЕНИЕ К MYSQL
    # ============================================
    info "📥 Прямое подключение к MySQL на сервере..."
    warn "⚠️  Убедитесь, что MySQL доступен с вашего IP адреса!"
    
    # Проверяем наличие mysql клиента
    if ! command -v mysql &> /dev/null; then
        error "MySQL клиент не установлен. Установите: brew install mysql-client (macOS) или apt-get install mysql-client (Linux)"
    fi
    
    # Импортируем напрямую
    if [ "$COMPRESS" = true ]; then
        gunzip < "$BACKUP_FILE" | mysql \
            -h "$SERVER_MYSQL_HOST" \
            -P 3306 \
            -u "$SERVER_DB_USER" \
            -p"$SERVER_DB_PASS" \
            "$SERVER_DB_NAME" || {
            error "Не удалось импортировать базу данных на сервере!"
        }
    else
        mysql \
            -h "$SERVER_MYSQL_HOST" \
            -P 3306 \
            -u "$SERVER_DB_USER" \
            -p"$SERVER_DB_PASS" \
            "$SERVER_DB_NAME" < "$BACKUP_FILE" || {
            error "Не удалось импортировать базу данных на сервере!"
        }
    fi
    
    info "✅ База данных импортирована на сервере"
    
    # Проверяем количество записей
    info "📊 Проверка данных на сервере..."
    mysql \
        -h "$SERVER_MYSQL_HOST" \
        -P 3306 \
        -u "$SERVER_DB_USER" \
        -p"$SERVER_DB_PASS" \
        "$SERVER_DB_NAME" \
        -e "
        SELECT 
            'groups' as table_name, COUNT(*) as count FROM \`groups\`
        UNION ALL
        SELECT 'subgroups', COUNT(*) FROM subgroups
        UNION ALL
        SELECT 'data', COUNT(*) FROM data
        UNION ALL
        SELECT 'authors', COUNT(*) FROM authors
        UNION ALL
        SELECT 'card_authors', COUNT(*) FROM card_authors
        UNION ALL
        SELECT 'versions', COUNT(*) FROM versions;
        " || {
        warn "Не удалось проверить данные на сервере"
    }
fi

# Удаляем локальный файл
read -p "Удалить локальный файл бэкапа? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm "$BACKUP_FILE"
    info "🗑️  Локальный файл удален"
else
    info "💾 Локальный файл сохранен: $BACKUP_FILE"
fi

echo
info "🎉 Перенос базы данных завершен успешно!"
warn "⚠️  Не забудьте обновить настройки в api/config.php на сервере!"
info "   DB_HOST: $SERVER_MYSQL_HOST"
info "   DB_USER: $SERVER_DB_USER"
info "   DB_NAME: $SERVER_DB_NAME"

