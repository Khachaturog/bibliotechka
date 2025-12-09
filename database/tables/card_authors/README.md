# Таблица `card_authors`

## Описание

Связующая таблица для связи карточек (из таблицы `data`) и авторов (из таблицы `authors`). Реализует связь many-to-many: одна карточка может иметь несколько авторов, один автор может быть связан с несколькими карточками.

## Структура

### Основные поля

| Поле | Тип | Null | Ключ | Описание |
|------|-----|------|------|----------|
| `card_slug` | VARCHAR(255) | NO | PRI, FK | Ссылка на карточку (таблица `data`) |
| `author_slug` | VARCHAR(255) | NO | PRI, FK | Ссылка на автора (таблица `authors`) |

### Автоматические поля

| Поле | Тип | Описание |
|------|-----|----------|
| `created_at_db` | TIMESTAMP | Дата создания записи в БД |

## Индексы

- `PRIMARY KEY` на (`card_slug`, `author_slug`) - составной первичный ключ
- `INDEX` на `card_slug` - для быстрого поиска карточек
- `INDEX` на `author_slug` - для быстрого поиска авторов

## Внешние ключи

- `fk_card_authors_card` - ссылка на `data.slug` (ON DELETE CASCADE)
- `fk_card_authors_author` - ссылка на `authors.slug` (ON DELETE CASCADE)

## Примеры запросов

```sql
-- Получить всех авторов для конкретной карточки
SELECT a.* 
FROM authors a
INNER JOIN card_authors ca ON a.slug = ca.author_slug
WHERE ca.card_slug = '001';

-- Получить все карточки конкретного автора
SELECT d.* 
FROM data d
INNER JOIN card_authors ca ON d.slug = ca.card_slug
WHERE ca.author_slug = '225';

-- Получить карточки с информацией об авторах
SELECT 
    d.slug,
    d.title,
    GROUP_CONCAT(a.title_ru SEPARATOR ', ') as authors
FROM data d
LEFT JOIN card_authors ca ON d.slug = ca.card_slug
LEFT JOIN authors a ON ca.author_slug = a.slug
GROUP BY d.slug, d.title;

-- Найти карточки без авторов
SELECT d.* 
FROM data d
LEFT JOIN card_authors ca ON d.slug = ca.card_slug
WHERE ca.card_slug IS NULL;
```

