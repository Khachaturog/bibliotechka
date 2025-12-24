# Таблица `subgroups`

## Описание

Таблица хранит информацию о подгруппах (подкатегориях) материалов. Соответствует данным из `data/subgroup.json`.

## Структура

| Поле | Тип | Null | Ключ | Описание |
|------|-----|------|------|----------|
| `slug` | VARCHAR(255) | NO | PRI | Уникальный идентификатор подгруппы (первичный ключ) |
| `title_ru` | VARCHAR(255) | NO | | Русское название подгруппы |
| `title_en` | VARCHAR(255) | YES | | Английское название подгруппы (равно slug) |
| `description_ru` | TEXT | YES | | Русское описание подгруппы |
| `status` | VARCHAR(255) | YES | | Статус подгруппы |
| `group_slug` | VARCHAR(255) | YES | FK | Ссылка на группу (FK → `groups.slug`) |
| `sort` | INT | YES | | Порядок сортировки подгрупп в рамках группы |
| `created_at` | TIMESTAMP | YES | | Дата создания (автоматически) |
| `updated_at` | TIMESTAMP | YES | | Дата обновления (автоматически) |

## Индексы

- `PRIMARY KEY` на `slug`
- `INDEX` на `group_slug` (для быстрого поиска по группе)
- `INDEX` на `(group_slug, sort)` (для сортировки подгрупп в рамках группы)

## Внешние ключи

- `subgroups.group_slug` → `groups.slug` (ON DELETE SET NULL, ON UPDATE CASCADE)

## Особенности

- `slug` является первичным ключом (уникальный, не может повторяться)
- `title_en` автоматически заполняется значением из `slug`
- Поддержка мультиязычности: `title_ru` и `title_en`
- При удалении группы (`groups`), поле `group_slug` устанавливается в `NULL` (подгруппы не удаляются)

## Примеры запросов

```sql
-- Получить все подгруппы
SELECT * FROM subgroups;

-- Получить подгруппу по slug
SELECT * FROM subgroups WHERE slug = '3d';

-- Поиск подгрупп по русскому названию
SELECT * FROM subgroups WHERE title_ru LIKE '%дизайн%';

-- Получить подгруппы с количеством элементов
SELECT s.slug, s.title_ru, COUNT(i.id) as items_count
FROM subgroups s
LEFT JOIN items i ON s.slug = i.subgroup_slug
GROUP BY s.slug;
```

