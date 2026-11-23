#!/bin/bash
# Скрипт для сравнения данных в таблице card_authors с CSV файлом
# Показывает недостающие записи

CSV_FILE="${1:-/Users/khachatur/Downloads/251213-Выгрузки из Notion/card_authors.csv}"

if [ ! -f "$CSV_FILE" ]; then
    echo "Ошибка: файл $CSV_FILE не найден"
    echo "Использование: $0 [path_to_csv]"
    exit 1
fi

# Параметры подключения к БД (можно переопределить через переменные окружения)
DB_HOST="${DB_HOST:-mysql.35401aca832c.hosting.myjino.ru}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-j35045845_biblio}"
DB_PASSWORD="${DB_PASSWORD:-tuhrih-zoqmYp}"
DB_NAME="${DB_NAME:-j35045845_biblio}"

echo "Сравнение данных card_authors..."
echo "CSV файл: $CSV_FILE"
echo ""

# Создаем временный SQL файл для сравнения
TEMP_SQL=$(mktemp)
TEMP_CSV_SQL=$(mktemp)

# Генерируем SQL для CSV данных
echo "USE $DB_NAME;" > "$TEMP_CSV_SQL"
echo "CREATE TEMPORARY TABLE csv_card_authors (card_slug VARCHAR(255), author_slug VARCHAR(255));" >> "$TEMP_CSV_SQL"

# Читаем CSV и генерируем INSERT
tail -n +2 "$CSV_FILE" | while IFS=',' read -r card_slug author_slug; do
    # Убираем BOM и пробелы
    card_slug=$(echo "$card_slug" | sed 's/^\xEF\xBB\xBF//' | xargs)
    author_slug=$(echo "$author_slug" | xargs)
    if [ -n "$card_slug" ] && [ -n "$author_slug" ]; then
        echo "INSERT INTO csv_card_authors VALUES ('$card_slug', '$author_slug');" >> "$TEMP_CSV_SQL"
    fi
done

# SQL запрос для сравнения
cat >> "$TEMP_SQL" << 'EOF'
USE bibliotechka;

-- Количество записей в БД
SELECT 'Записей в БД (card_authors)' as info, COUNT(*) as count FROM card_authors;

-- Количество записей в CSV (временная таблица)
SELECT 'Записей в CSV' as info, COUNT(*) as count FROM csv_card_authors;

-- Записи, которые есть в CSV, но отсутствуют в БД
SELECT 
    'Записи из CSV, отсутствующие в БД' as info,
    ca.card_slug,
    ca.author_slug
FROM csv_card_authors ca
LEFT JOIN card_authors db ON ca.card_slug = db.card_slug AND ca.author_slug = db.author_slug
WHERE db.card_slug IS NULL
ORDER BY ca.card_slug, ca.author_slug;

-- Записи, которые есть в БД, но отсутствуют в CSV
SELECT 
    'Записи из БД, отсутствующие в CSV' as info,
    db.card_slug,
    db.author_slug
FROM card_authors db
LEFT JOIN csv_card_authors ca ON db.card_slug = ca.card_slug AND db.author_slug = ca.author_slug
WHERE ca.card_slug IS NULL
ORDER BY db.card_slug, db.author_slug;

-- Статистика по карточкам с несколькими авторами
SELECT 
    'Карточки с несколькими авторами (топ-10)' as info,
    card_slug,
    COUNT(*) as author_count
FROM card_authors
GROUP BY card_slug
HAVING COUNT(*) > 1
ORDER BY author_count DESC, card_slug
LIMIT 10;
EOF

# Объединяем SQL файлы
cat "$TEMP_CSV_SQL" "$TEMP_SQL" > "${TEMP_SQL}.combined"

echo "Выполняю сравнение..."
echo ""

if command -v mysql &> /dev/null; then
    mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" < "${TEMP_SQL}.combined"
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    docker run --rm -i \
        mysql:8.0 \
        mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" < "${TEMP_SQL}.combined"
else
    echo "Ошибка: не найден mysql клиент или docker"
    echo "SQL запрос сохранен в: ${TEMP_SQL}.combined"
    exit 1
fi

# Удаляем временные файлы
rm -f "$TEMP_SQL" "$TEMP_CSV_SQL" "${TEMP_SQL}.combined"

