#!/bin/bash
# Восстановление только subgroup hiring и 8 записей из data

DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

BACKUP_FILE="backups/backup_before_migration_014_20251218_230151.sql"

echo "🔄 Восстановление subgroup hiring и 8 записей из data..."
echo ""

# Создаём SQL файл
cat > /tmp/restore_hiring.sql << 'RESTORE_SQL'
SET FOREIGN_KEY_CHECKS = 0;

-- Восстановление subgroup hiring
RESTORE_SQL

# Извлекаем запись hiring из бэкапа
python3 << 'PYTHON_SCRIPT'
import re

backup_file = 'backups/backup_before_migration_014_20251218_230151.sql'
with open(backup_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Находим полную строку INSERT INTO subgroups
subgroups_match = re.search(r"INSERT INTO `subgroups` VALUES \((.+?)\);", content, re.DOTALL)
if subgroups_match:
    full_insert = subgroups_match.group(0)
    # Ищем запись с hiring - ищем паттерн от ('hiring' до закрывающей скобки
    # Но нужно учесть, что внутри могут быть скобки, поэтому ищем до следующей ),('
    pattern = r"\('hiring'[^)]*(?:\)[^,)]*)*\)"
    matches = re.finditer(r"\('hiring'[^)]+\)", full_insert)
    for match in matches:
        # Проверяем, что это полная запись (считаем кавычки)
        record = match.group(0)
        # В subgroups должно быть 7 полей: slug, title_ru, title_en, description_ru, status, created_at, updated_at
        # Считаем количество одинарных кавычек (должно быть примерно 14)
        if record.count("'") >= 12:  # Минимум для 7 полей
            with open('/tmp/restore_hiring.sql', 'a', encoding='utf-8') as f:
                f.write("INSERT INTO `subgroups` VALUES " + record + ";\n\n")
            break

# Находим записи data
data_match = re.search(r"INSERT INTO `data` VALUES \((.+?)\);", content, re.DOTALL)
if data_match:
    full_insert = data_match.group(0)
    missing_slugs = ['229', '312', '359', '360', '399', '556', '557', '558']
    
    with open('/tmp/restore_hiring.sql', 'a', encoding='utf-8') as f:
        f.write("-- Восстановление 8 записей из data\n")
        for slug in missing_slugs:
            # Ищем запись начинающуюся с ('slug'
            pattern = r"\('" + re.escape(slug) + "'[^)]+\)"
            # Но нужно найти полную запись до следующей ),('
            # Используем более точный поиск
            start_pos = full_insert.find("('" + slug + "'")
            if start_pos != -1:
                # Ищем конец записи - следующую ),(' или конец строки
                end_pos = full_insert.find("),('", start_pos)
                if end_pos == -1:
                    end_pos = full_insert.find(");", start_pos)
                if end_pos != -1:
                    record = full_insert[start_pos:end_pos+1]
                    f.write("INSERT INTO `data` VALUES " + record + ";\n")
    
    with open('/tmp/restore_hiring.sql', 'a', encoding='utf-8') as f:
        f.write("\nSET FOREIGN_KEY_CHECKS = 1;\n")
    
    print("✅ SQL файл создан")
PYTHON_SCRIPT

# Выполняем восстановление
if [ -f /tmp/restore_hiring.sql ]; then
    if command -v mysql &> /dev/null; then
        mysql \
            -h "$DB_HOST" \
            -P "$DB_PORT" \
            -u "$DB_USER" \
            -p"$DB_PASSWORD" \
            "$DB_NAME" < /tmp/restore_hiring.sql
    elif command -v docker &> /dev/null && docker ps &> /dev/null; then
        docker run --rm -i \
            mysql:8.0 \
            mysql \
            -h "$DB_HOST" \
            -P "$DB_PORT" \
            -u "$DB_USER" \
            -p"$DB_PASSWORD" \
            "$DB_NAME" < /tmp/restore_hiring.sql
    fi
    
    rm -f /tmp/restore_hiring.sql
    echo ""
    echo "✅ Восстановление завершено!"
else
    echo "❌ Ошибка: SQL файл не создан"
    exit 1
fi


