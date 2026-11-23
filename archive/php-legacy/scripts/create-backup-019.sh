#!/bin/bash
# Бэкап перед миграцией 019 (cover_short / cover_large, удаление cover и cover_notion)

DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_before_migration_019_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "Creating backup before migration 019..."
echo "DB: ${DB_NAME} -> ${BACKUP_FILE}"

if command -v mysqldump &> /dev/null; then
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
    docker run --rm mysql:8.0 mysqldump \
        -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        --single-transaction --routines --triggers \
        --default-character-set=utf8mb4 --no-tablespaces \
        "$DB_NAME" > "$BACKUP_FILE"
else
    echo "Error: mysqldump and Docker not found"
    exit 1
fi

if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    echo "Backup OK: ${BACKUP_FILE} ($(ls -lh "$BACKUP_FILE" | awk '{print $5}'))"
else
    echo "Error: backup empty or missing"
    exit 1
fi
