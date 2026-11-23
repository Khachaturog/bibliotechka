# Таблица `versions`

## Описание

Таблица хранит информацию о версиях/релизах проекта Библиотечка. Содержит историю изменений, обновлений и новых функций.

## Структура

### Основные поля

| Поле | Тип | Null | Ключ | Описание |
|------|-----|------|------|----------|
| `slug` | VARCHAR(255) | NO | PRI | Первичный ключ, уникальный идентификатор версии |
| `version` | VARCHAR(50) | NO | | Номер версии (например, 5.0, 4.1) |
| `title` | VARCHAR(255) | NO | | Название версии/релиза |
| `description` | TEXT | YES | | Подробное описание изменений в версии |
| `release_date` | VARCHAR(255) | YES | | Дата релиза (из исходных данных) |
| `url` | VARCHAR(500) | YES | | Ссылка на пост/анонс версии |

### Автоматические поля

| Поле | Тип | Описание |
|------|-----|----------|
| `created_at_db` | TIMESTAMP | Дата создания записи в БД |
| `updated_at_db` | TIMESTAMP | Дата последнего обновления записи в БД |

## Индексы

- `PRIMARY KEY` на `slug`

## Связи

Таблица `versions` связана с таблицей `data`:
- `versions.slug` ← `data.version_slug` (внешний ключ `fk_data_version`)
- При удалении версии, связанные элементы в `data` получат `version_slug = NULL` (ON DELETE SET NULL)
- При обновлении `slug` версии, связанные элементы автоматически обновятся (ON UPDATE CASCADE)

## Примеры запросов

```sql
-- Получить все версии, отсортированные по дате релиза (новые сначала)
SELECT * FROM versions 
ORDER BY release_date DESC;

-- Получить последнюю версию
SELECT * FROM versions 
ORDER BY release_date DESC 
LIMIT 1;

-- Получить версию по slug
SELECT * FROM versions WHERE slug = '10';

-- Получить версию по номеру версии
SELECT * FROM versions WHERE version = '5.0';

-- Получить версию с количеством связанных элементов
SELECT 
    v.*,
    COUNT(d.slug) as items_count
FROM versions v
LEFT JOIN data d ON v.slug = d.version_slug
GROUP BY v.slug;

-- Получить все элементы конкретной версии
SELECT d.*, v.version, v.title as version_title
FROM data d
JOIN versions v ON d.version_slug = v.slug
WHERE v.slug = '10';
```

