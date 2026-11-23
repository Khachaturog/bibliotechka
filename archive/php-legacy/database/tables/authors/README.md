# Таблица `authors`

## Описание

Таблица хранит информацию об авторах материалов, ресурсов и контента в Библиотечке.

## Структура

### Основные поля

| Поле | Тип | Null | Ключ | Описание |
|------|-----|------|------|----------|
| `slug` | VARCHAR(255) | NO | PRI | Первичный ключ, уникальный идентификатор автора |
| `title_ru` | VARCHAR(255) | NO | | Имя автора на русском языке |
| `title_en` | VARCHAR(255) | YES | | Имя автора на английском языке |
| `avatar` | VARCHAR(500) | YES | | Путь к аватару автора |

### Автоматические поля

| Поле | Тип | Описание |
|------|-----|----------|
| `created_at_db` | TIMESTAMP | Дата создания записи в БД |
| `updated_at_db` | TIMESTAMP | Дата последнего обновления записи в БД |

## Индексы

- `PRIMARY KEY` на `slug`

## Примеры запросов

```sql
-- Получить всех авторов
SELECT * FROM authors ORDER BY title_ru;

-- Получить автора по slug
SELECT * FROM authors WHERE slug = '001';

-- Поиск автора по имени (русский)
SELECT * FROM authors WHERE title_ru LIKE '%Илья%';

-- Поиск автора по имени (английский)
SELECT * FROM authors WHERE title_en LIKE '%Ilya%';

-- Получить авторов с аватарами
SELECT * FROM authors WHERE avatar IS NOT NULL AND avatar != '';
```

