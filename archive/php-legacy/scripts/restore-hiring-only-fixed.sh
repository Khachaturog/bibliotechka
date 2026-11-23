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

# Извлекаем данные из бэкапа и создаём правильный SQL
python3 << 'PYTHON_SCRIPT'
import re

backup_file = 'backups/backup_before_migration_014_20251218_230151.sql'
with open(backup_file, 'r', encoding='utf-8') as f:
    content = f.read()

sql_output = []
sql_output.append("SET FOREIGN_KEY_CHECKS = 0;")
sql_output.append("")

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
            sql_output.append("-- Восстановление subgroup hiring")
            sql_output.append("INSERT INTO `subgroups` VALUES ('" + record + "');")
            sql_output.append("")
            break

# Находим INSERT INTO data
data_match = re.search(r"INSERT INTO `data` VALUES \((.+?)\);", content, re.DOTALL)
if data_match:
    values = data_match.group(1)
    records = re.split(r"\),\s*\('", values)
    records[0] = records[0].lstrip("('")
    records[-1] = records[-1].rstrip("')")
    
    missing_slugs = ['229', '312', '359', '360', '399', '556', '557', '558']
    
    sql_output.append("-- Восстановление 8 записей из data")
    for record in records:
        fields = record.split("','")
        if fields and fields[0].strip("'") in missing_slugs:
            sql_output.append("INSERT INTO `data` VALUES ('" + record + "');")
    
    sql_output.append("")
    sql_output.append("SET FOREIGN_KEY_CHECKS = 1;")
    
    with open('/tmp/restore_hiring.sql', 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_output))
    
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


