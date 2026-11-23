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

# Создаём SQL
cat > /tmp/restore_hiring.sql << 'RESTORE_SQL'
SET FOREIGN_KEY_CHECKS = 0;

-- Восстановление subgroup hiring (с новым slug skill-hiring)
INSERT INTO `subgroups` (`slug`, `title_ru`, `title_en`, `description_ru`, `status`, `group_slug`, `sort`, `created_at`, `updated_at`)
VALUES ('skill-hiring', 'Карьера', 'hiring', 'Советы по трудоустройству и развитию в профессии', 'new', 'skill', 0, '2025-12-13 19:09:37', '2025-12-13 19:09:37')
ON DUPLICATE KEY UPDATE `title_ru` = VALUES(`title_ru`);

RESTORE_SQL

# Извлекаем оригинальные записи из бэкапа и добавляем в SQL
python3 << 'PYTHON_SCRIPT'
import re

backup_file = 'backups/backup_before_migration_014_20251218_230151.sql'
with open(backup_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Находим полную строку INSERT INTO data
data_match = re.search(r"INSERT INTO `data` VALUES \((.+?)\);", content, re.DOTALL)
if data_match:
    full_insert = data_match.group(0)
    missing_slugs = ['229', '312', '359', '360', '399', '556', '557', '558']
    
    with open('/tmp/restore_hiring.sql', 'a', encoding='utf-8') as f:
        f.write("\n-- Восстановление 8 записей из data (с оригинальными данными)\n")
        for slug in missing_slugs:
            start_pos = full_insert.find("('" + slug + "'")
            if start_pos != -1:
                end_pos1 = full_insert.find("),('", start_pos)
                end_pos2 = full_insert.find(");", start_pos)
                end_pos = end_pos1 if (end_pos1 != -1 and (end_pos2 == -1 or end_pos1 < end_pos2)) else end_pos2
                if end_pos != -1:
                    record = full_insert[start_pos:end_pos+1]
                    f.write("INSERT INTO `data` VALUES " + record + ";\n")
        
        f.write("\n-- Обновляем subgroup_slug на новый формат skill-hiring\n")
        f.write("UPDATE `data` SET subgroup_slug = 'skill-hiring' WHERE subgroup_slug = 'hiring' AND group_slug = 'skill';\n")
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


