#!/bin/bash
# Сравнение slug из бэкапа и текущей базы

DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

echo "🔍 Сравнение данных..."
echo ""

# Получаем slug из текущей базы
SQL_CURRENT=$(cat <<'EOF'
SELECT slug FROM data ORDER BY slug;
EOF
)

# Сохраняем в файл
if command -v mysql &> /dev/null; then
    echo "$SQL_CURRENT" | mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" > /tmp/current_slugs.txt
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    echo "$SQL_CURRENT" | docker run --rm -i \
        mysql:8.0 \
        mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" > /tmp/current_slugs.txt
fi

# Извлекаем slug из бэкапа
python3 << 'PYTHON_SCRIPT'
import re

backup_file = 'backups/backup_before_migration_014_20251218_230151.sql'
with open(backup_file, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r"INSERT INTO `data` VALUES \((.+?)\);", content, re.DOTALL)
if match:
    values = match.group(1)
    records = re.split(r"\),\s*\('", values)
    records[0] = records[0].lstrip("('")
    records[-1] = records[-1].rstrip("')")
    
    backup_slugs = set()
    for record in records:
        fields = record.split("','")
        if fields:
            slug = fields[0].strip("'")
            backup_slugs.add(slug)
    
    with open('/tmp/backup_slugs.txt', 'w') as f:
        for slug in sorted(backup_slugs):
            f.write(slug + '\n')
    
    print(f"✅ Извлечено {len(backup_slugs)} slug из бэкапа")
PYTHON_SCRIPT

# Сравниваем
echo ""
echo "📊 Сравнение:"
echo ""

# Убираем заголовок из current_slugs.txt
tail -n +2 /tmp/current_slugs.txt > /tmp/current_slugs_clean.txt

CURRENT_COUNT=$(wc -l < /tmp/current_slugs_clean.txt | tr -d ' ')
BACKUP_COUNT=$(wc -l < /tmp/backup_slugs.txt | tr -d ' ')

echo "Текущая база: $CURRENT_COUNT записей"
echo "Бэкап: $BACKUP_COUNT записей"
echo ""

# Находим разницу
echo "Записи в бэкапе, но НЕТ в текущей базе:"
comm -23 /tmp/backup_slugs.txt /tmp/current_slugs_clean.txt

echo ""
echo "Записи в текущей базе, но НЕТ в бэкапе:"
comm -13 /tmp/backup_slugs.txt /tmp/current_slugs_clean.txt

rm -f /tmp/current_slugs.txt /tmp/current_slugs_clean.txt /tmp/backup_slugs.txt


