# Таблица `groups`

## Описание

Таблица хранит информацию о группах (категориях) материалов. Соответствует данным из `data/group.json`.

## Структура

| Поле | Тип | Null | Ключ | Описание |
|------|-----|------|------|----------|
| `slug` | VARCHAR(255) | NO | PRI | Уникальный идентификатор группы (первичный ключ) |
| `title_ru` | VARCHAR(255) | NO | | Русское название группы |
| `title_en` | VARCHAR(255) | YES | | Английское название группы (равно slug) |
| `badge` | VARCHAR(255) | YES | | Бейдж группы |
| `cover` | VARCHAR(500) | YES | | Путь к обложке группы |
| `cover_notion` | VARCHAR(500) | YES | | URL обложки из Notion |
| `description_ru` | TEXT | YES | | Русское описание группы |
| `description_seo` | TEXT | YES | | SEO описание |
| `keywords_seo` | VARCHAR(500) | YES | | SEO ключевые слова |
| `og_description` | TEXT | YES | | Open Graph описание |
| `og_image` | VARCHAR(500) | YES | | Open Graph изображение |
| `og_title` | VARCHAR(255) | YES | | Open Graph заголовок |
| `sort` | INT | YES | MUL | Порядок сортировки |
| `title_seo` | VARCHAR(255) | YES | | SEO заголовок |
| `created_at` | TIMESTAMP | YES | | Дата создания |
| `updated_at` | TIMESTAMP | YES | | Дата обновления |

## Индексы

- `PRIMARY KEY` на `slug`
- `INDEX` на `sort`

## Особенности

- `slug` является первичным ключом (уникальный, не может повторяться)
- `title_en` автоматически заполняется значением из `slug`
- Поддержка мультиязычности: `title_ru` и `title_en`

## Примеры запросов

```sql
-- Получить все группы
SELECT * FROM `groups` ORDER BY sort;

-- Получить группу по slug
SELECT * FROM `groups` WHERE slug = 'designsystem';

-- Подсчет элементов в группах
SELECT g.slug, g.title_ru, COUNT(i.id) as items_count
FROM `groups` g
LEFT JOIN items i ON g.slug = i.group_slug
GROUP BY g.slug;
```

