# Миграция 014: Добавление group_slug и sort в subgroups

## Описание

Добавляет колонки `group_slug` и `sort` в таблицу `subgroups`, обновляет `slug` на формат `group-subgroup` и создаёт дубликаты подгрупп для каждой группы.

## Изменения

### 1. Структура таблицы `subgroups`

**Было:**
```sql
CREATE TABLE `subgroups` (
  `slug` VARCHAR(255) PRIMARY KEY,
  `title_ru` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) DEFAULT '',
  `description_ru` TEXT,
  `status` VARCHAR(255) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Стало:**
```sql
CREATE TABLE `subgroups` (
  `slug` VARCHAR(255) PRIMARY KEY,  -- Теперь формат: "group-subgroup"
  `title_ru` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) DEFAULT '',
  `description_ru` TEXT,
  `status` VARCHAR(255) DEFAULT '',
  `group_slug` VARCHAR(255) NOT NULL,  -- ← НОВОЕ
  `sort` INT DEFAULT 0,                 -- ← НОВОЕ
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`group_slug`) REFERENCES `groups`(`slug`) ON DELETE CASCADE
);
```

### 2. Изменение формата slug

**Было:** `ui`, `text`, `other`

**Стало:** `skill-ui`, `designsystem-text`, `reference-other`

### 3. Создание дубликатов

Для подгрупп, которые используются в нескольких группах, создаются отдельные записи:

- `other` → `books-other`, `reference-other`, `designsystem-other`, и т.д.
- `ui` → `skill-ui`, `trainer-ui`
- `text` → `designsystem-text`, `resource-text`

## Процесс миграции

1. **Добавление колонок** - добавляются `group_slug` и `sort`
2. **Создание маппинга** - временная таблица со связью старых и новых slug
3. **Создание дубликатов** - для каждой комбинации group+subgroup создаётся запись
4. **Обновление данных** - `data.subgroup_slug` обновляется на новые значения
5. **Очистка** - удаляются старые записи, которые больше не используются
6. **Обновление внешних ключей** - настраиваются связи

## Примеры данных после миграции

| slug | title_ru | group_slug | sort |
|------|----------|------------|------|
| skill-ui | UI | skill | 1 |
| trainer-ui | UI | trainer | 1 |
| designsystem-text | Тексты | designsystem | 1 |
| resource-text | Тексты | resource | 1 |
| reference-other | Разное | reference | 1 |
| books-other | Разное | books | 1 |

## Обновление sort вручную

После миграции можно обновить порядок сортировки:

```sql
-- Пример: установить порядок для подгрупп в группе skill
UPDATE subgroups SET sort = 1 WHERE slug = 'skill-ui' AND group_slug = 'skill';
UPDATE subgroups SET sort = 2 WHERE slug = 'skill-ux' AND group_slug = 'skill';
UPDATE subgroups SET sort = 3 WHERE slug = 'skill-knowledge' AND group_slug = 'skill';
```

## Запросы после миграции

### Получить все подгруппы группы с сортировкой:

```sql
SELECT * FROM subgroups 
WHERE group_slug = 'skill' 
ORDER BY sort, title_ru;
```

### Получить подгруппу по slug:

```sql
SELECT * FROM subgroups 
WHERE slug = 'skill-ui';
```

### Получить подгруппы с информацией о группе:

```sql
SELECT 
    s.*,
    g.title_ru as group_title
FROM subgroups s
JOIN `groups` g ON s.group_slug = g.slug
WHERE s.group_slug = 'skill'
ORDER BY s.sort, s.title_ru;
```

## Откат миграции

⚠️ **Внимание:** Откат этой миграции сложен, так как данные уже изменены. Рекомендуется сделать бэкап перед выполнением.

Если нужно откатить:

1. Восстановить данные из бэкапа
2. Или вручную вернуть старые slug в таблице `data`

## Проверка после миграции

```sql
-- Проверить, что все подгруппы имеют group_slug
SELECT COUNT(*) as without_group 
FROM subgroups 
WHERE group_slug IS NULL;
-- Должно быть 0

-- Проверить, что все slug в формате group-subgroup
SELECT COUNT(*) as old_format 
FROM subgroups 
WHERE slug NOT LIKE '%-%';
-- Должно быть 0 (или только системные записи, если есть)

-- Проверить статистику по группам
SELECT 
    group_slug,
    COUNT(*) as subgroups_count
FROM subgroups
GROUP BY group_slug
ORDER BY group_slug;
```

