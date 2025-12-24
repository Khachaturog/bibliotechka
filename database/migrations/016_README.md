# Миграция 016: Синхронизация таблицы card_authors с данными из Notion

## Описание

Эта миграция синхронизирует таблицу `card_authors` с данными из CSV файла, экспортированного из Notion. Миграция добавляет недостающие записи, не удаляя существующие.

## Проблема

В таблице `card_authors` было 715 записей, а должно быть 723 записи (согласно CSV из Notion). Не хватает 8 записей.

## Решение

Миграция использует `INSERT IGNORE`, что означает:
- ✅ Добавляются только недостающие записи
- ✅ Существующие записи не изменяются
- ✅ Дубликаты игнорируются (без ошибок)

## Выполнение миграции

### 1. Создание резервной копии (ОБЯЗАТЕЛЬНО!)

```bash
# Локально (Docker)
docker exec bibliotechka-mysql mysqldump -uroot -proot bibliotechka card_authors > backups/backup_card_authors_$(date +%Y%m%d_%H%M%S).sql

# На сервере
mysqldump -h HOST -u USER -p DATABASE card_authors > backup_card_authors_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Проверка текущего состояния

```bash
# Используйте скрипт для сравнения
./scripts/compare-card-authors.sh /path/to/card_authors.csv
```

### 3. Выполнение миграции

```bash
# Локально (Docker)
docker exec -i bibliotechka-mysql mysql -uroot -proot bibliotechka < database/migrations/016_sync_card_authors_from_notion.sql

# На сервере
mysql -h HOST -u USER -p DATABASE < database/migrations/016_sync_card_authors_from_notion.sql
```

### 4. Проверка результата

После выполнения миграции проверьте:

```sql
-- Количество записей должно быть 723
SELECT COUNT(*) FROM card_authors;

-- Должно быть 0 записей (если все синхронизировано)
SELECT ca.card_slug, ca.author_slug
FROM csv_card_authors ca
LEFT JOIN card_authors db ON ca.card_slug = db.card_slug AND ca.author_slug = db.author_slug
WHERE db.card_slug IS NULL;
```

## Откат

Если нужно откатить миграцию:

```sql
-- Восстановление из резервной копии
-- Сначала удалите текущие данные
TRUNCATE TABLE card_authors;

-- Затем восстановите из бэкапа
-- (замените путь на актуальный)
SOURCE backups/backup_card_authors_YYYYMMDD_HHMMSS.sql;
```

Или используйте скрипт восстановления:

```bash
mysql -h HOST -u USER -p DATABASE < backups/backup_card_authors_YYYYMMDD_HHMMSS.sql
```

## Статистика

- **Записей в CSV**: 723
- **Записей в БД до миграции**: 715
- **Недостающих записей**: 8
- **Записей в БД после миграции**: 723 (ожидаемое)

## Дата

2025-12-23

## Источник данных

CSV файл из Notion: `card_authors.csv` (дата экспорта: 2025-12-13)

