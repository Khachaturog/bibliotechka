# Таблица `data`

## Описание

Таблица хранит информацию об элементах (материалах, карточках). Соответствует данным из `data/data.json`. Это основная таблица с контентом.

**Примечание:** Таблица была переименована из `items` в `data`.

## Структура

### Основные поля

| Поле | Тип | Null | Ключ | Описание |
|------|-----|------|------|----------|
| `slug` | VARCHAR(255) | NO | PRI | Первичный ключ, уникальный идентификатор элемента |
| `title` | VARCHAR(255) | NO | | Название элемента |
| `cover_short` | VARCHAR(500) | YES | | URL обложки для списков (short) |
| `cover_large` | VARCHAR(500) | YES | | URL обложки для страницы карточки (large) |
| `description` | TEXT | YES | | Описание элемента |

### SEO поля

| Поле | Тип | Описание |
|------|-----|----------|
| `url_seo_yandex` | VARCHAR(500) | SEO URL для Yandex |
| `url_seo_google` | VARCHAR(500) | SEO URL для Google |

### Связи

| Поле | Тип | Ключ | Описание |
|------|-----|------|----------|
| `group_slug` | VARCHAR(255) | MUL, FK | Ссылка на группу (FK → `groups.slug`) |
| `subgroup_slug` | VARCHAR(255) | MUL, FK | Ссылка на подгруппу (FK → `subgroups.slug`) |
| `version_slug` | VARCHAR(255) | MUL, FK | Ссылка на версию (FK → `versions.slug`) |
| `author_slug` | VARCHAR(255) | | Автор |
| `status_slug` | VARCHAR(255) | MUL | Статус элемента |

### Ссылки (URL)

| Поле | Тип | Описание |
|------|-----|----------|
| `url_1` до `url_6` | VARCHAR(500) | Ссылки на ресурсы |
| `url_title_1` до `url_title_6` | VARCHAR(255) | Заголовки ссылок |

### Даты

| Поле | Тип | Описание |
|------|-----|----------|
| `start_date` | VARCHAR(255) | Дата начала |
| `end_date` | VARCHAR(255) | Дата окончания |
| `published` | VARCHAR(255) | Дата публикации |
| `created_at` | VARCHAR(255) | Дата создания (из JSON) |
| `updated_at` | VARCHAR(255) | Дата обновления (из JSON) |
| `created_at_db` | TIMESTAMP | Дата создания в БД |
| `updated_at_db` | TIMESTAMP | Дата обновления в БД |

### Дополнительные поля

| Поле | Тип | Описание |
|------|-----|----------|
| `summary_ai` | TEXT | AI саммари |
| `detail` | TEXT | Детали |
| `comment` | TEXT | Комментарий |

## Индексы

- `PRIMARY KEY` на `slug`
- `INDEX` на `group_slug`
- `INDEX` на `subgroup_slug`
- `INDEX` на `status_slug`
- `INDEX` на `version_slug`
- `INDEX` на `(group_slug, subgroup_slug)`

## Внешние ключи

- `data.group_slug` → `groups.slug` (ON DELETE SET NULL, ON UPDATE CASCADE)
- `data.subgroup_slug` → `subgroups.slug` (ON DELETE SET NULL, ON UPDATE CASCADE)
- `data.version_slug` → `versions.slug` (ON DELETE SET NULL, ON UPDATE CASCADE)

## Примеры запросов

```sql
-- Получить все элементы
SELECT * FROM data LIMIT 10;

-- Получить элемент по slug
SELECT * FROM data WHERE slug = '001';

-- Получить элементы группы
SELECT * FROM data WHERE group_slug = 'designsystem';

-- Получить элементы подгруппы
SELECT * FROM data WHERE subgroup_slug = '3d';

-- Поиск по названию
SELECT * FROM data WHERE title LIKE '%гайд%';

-- Получить элементы с информацией о группе, подгруппе и версии
SELECT 
    d.*,
    g.title_ru as group_title,
    s.title_ru as subgroup_title,
    v.version as version_number,
    v.title as version_title
FROM data d
LEFT JOIN `groups` g ON d.group_slug = g.slug
LEFT JOIN subgroups s ON d.subgroup_slug = s.slug
LEFT JOIN versions v ON d.version_slug = v.slug;
```

