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

# Извлекаем данные из бэкапа
python3 << 'PYTHON_SCRIPT'
import re

backup_file = 'backups/backup_before_migration_014_20251218_230151.sql'
with open(backup_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Находим INSERT INTO subgroups
subgroups_match = re.search(r"INSERT INTO `subgroups` VALUES \((.+?)\);", content, re.DOTALL)
if subgroups_match:
    values = subgroups_match.group(1)
    records = re.split(r"\),\s*\('", values)
    records[0] = records[0].lstrip("('")
    records[-1] = records[-1].rstrip("')")
    
    # Ищем запись с slug = 'hiring'
    for record in records:
        fields = record.split("','")
        if fields and fields[0].strip("'") == 'hiring':
            with open('/tmp/restore_hiring.sql', 'w') as f:
                f.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")
                f.write("-- Восстановление subgroup hiring\n")
                f.write("INSERT INTO `subgroups` VALUES ('" + record + "');\n\n")
            break

# Находим INSERT INTO data
data_match = re.search(r"INSERT INTO `data` VALUES \((.+?)\);", content, re.DOTALL)
if data_match:
    values = data_match.group(1)
    records = re.split(r"\),\s*\('", values)
    records[0] = records[0].lstrip("('")
    records[-1] = records[-1].rstrip("')")
    
    missing_slugs = ['229', '312', '359', '360', '399', '556', '557', '558']
    
    with open('/tmp/restore_hiring.sql', 'a') as f:
        f.write("-- Восстановление 8 записей из data\n")
        for record in records:
            fields = record.split("','")
            if fields and fields[0].strip("'") in missing_slugs:
                f.write("INSERT INTO `data` VALUES ('" + record + "');\n")
        
        f.write("\nSET FOREIGN_KEY_CHECKS = 1;\n")
    
    print("✅ SQL файл создан: /tmp/restore_hiring.sql")
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


