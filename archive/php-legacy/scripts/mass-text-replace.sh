#!/bin/bash
# Быстрая массовая замена текста в базе данных
# Использование: ./scripts/mass-text-replace.sh "старый текст" "новый текст" table_name column_name

OLD_TEXT="$1"
NEW_TEXT="$2"
TABLE="$3"
COLUMN="$4"

if [ -z "$OLD_TEXT" ] || [ -z "$NEW_TEXT" ] || [ -z "$TABLE" ] || [ -z "$COLUMN" ]; then
    echo "❌ Использование: $0 \"старый текст\" \"новый текст\" table_name column_name"
    echo ""
    echo "Примеры:"
    echo "  $0 \"старый текст\" \"новый текст\" data title"
    echo "  $0 \"https://old.url\" \"https://new.url\" data url_1"
    exit 1
fi

DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

echo "🔍 Ищу записи с текстом: '$OLD_TEXT'"
echo "📊 Таблица: $TABLE, Колонка: $COLUMN"
echo ""

# Сначала показываем, сколько записей будет затронуто
PREVIEW_SQL=$(cat <<EOF
SELECT COUNT(*) as count
FROM \`$TABLE\`
WHERE \`$COLUMN\` LIKE '%$OLD_TEXT%';
EOF
)

echo "📈 Количество затронутых записей:"
if command -v mysql &> /dev/null; then
    echo "$PREVIEW_SQL" | mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME"
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    echo "$PREVIEW_SQL" | docker run --rm -i \
        mysql:8.0 \
        mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME"
fi

echo ""
echo "⚠️  ВНИМАНИЕ: Это действие изменит данные в базе!"
read -p "Продолжить? (yes/no): " response

if [ "$response" != "yes" ]; then
    echo "❌ Операция отменена"
    exit 0
fi

# Выполняем замену
REPLACE_SQL=$(cat <<EOF
UPDATE \`$TABLE\`
SET \`$COLUMN\` = REPLACE(\`$COLUMN\`, '$OLD_TEXT', '$NEW_TEXT')
WHERE \`$COLUMN\` LIKE '%$OLD_TEXT%';
EOF
)

echo ""
echo "🔄 Выполняю замену..."

if command -v mysql &> /dev/null; then
    echo "$REPLACE_SQL" | mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME"
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    echo "$REPLACE_SQL" | docker run --rm -i \
        mysql:8.0 \
        mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME"
fi

echo ""
echo "✅ Замена завершена!"

