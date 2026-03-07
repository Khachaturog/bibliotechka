# Анализ пересечений подгрупп между группами

## SQL запросы для анализа

### 1. Все уникальные комбинации group + subgroup

```sql
SELECT 
    group_slug,
    subgroup_slug,
    COUNT(*) as cards_count
FROM data
GROUP BY group_slug, subgroup_slug
ORDER BY group_slug, subgroup_slug;
```

### 2. Подгруппы, которые встречаются в нескольких группах (ПРОБЛЕМНЫЕ)

```sql
SELECT 
    subgroup_slug,
    COUNT(DISTINCT group_slug) as groups_count,
    GROUP_CONCAT(DISTINCT group_slug ORDER BY group_slug SEPARATOR ', ') as groups_list
FROM data
GROUP BY subgroup_slug
HAVING COUNT(DISTINCT group_slug) > 1
ORDER BY groups_count DESC, subgroup_slug;
```

### 3. Детальная карта: какая подгруппа в каких группах

```sql
SELECT 
    subgroup_slug,
    GROUP_CONCAT(DISTINCT group_slug ORDER BY group_slug SEPARATOR ' → ') as groups_chain,
    COUNT(DISTINCT group_slug) as groups_count,
    SUM(cards_count) as total_cards
FROM (
    SELECT 
        group_slug,
        subgroup_slug,
        COUNT(*) as cards_count
    FROM data
    GROUP BY group_slug, subgroup_slug
) as grouped
GROUP BY subgroup_slug
ORDER BY groups_count DESC, subgroup_slug;
```

### 4. Статистика по группам (сколько подгрупп в каждой группе)

```sql
SELECT 
    group_slug,
    COUNT(DISTINCT subgroup_slug) as subgroups_count,
    GROUP_CONCAT(DISTINCT subgroup_slug ORDER BY subgroup_slug SEPARATOR ', ') as subgroups_list
FROM data
GROUP BY group_slug
ORDER BY subgroups_count DESC;
```

---

## Пример результатов (нужно выполнить на реальной БД)

После выполнения запросов на вашей базе данных, результаты будут выглядеть примерно так:

### Подгруппы, используемые в нескольких группах:

| subgroup_slug | Количество групп | Группы |
|---------------|------------------|--------|
| ui | 3 | designsystem, reference, skill |
| tool | 2 | resource, skill |
| course | 2 | books, skill |
| ... | ... | ... |

### Полная карта по группам:

| Группа | Количество подгрупп | Список подгрупп |
|--------|---------------------|-----------------|
| skill | 15 | course, tool, ux, ui, ... |
| reference | 12 | mobbin, dribble-arena-pinterest, ui, ... |
| designsystem | 8 | ds, guidelines, ui-kit, ui, ... |
| ... | ... | ... |

---

## Рекомендации

После получения результатов:

1. **Для каждой подгруппы, которая встречается в нескольких группах:**
   - Решите, в какой группе она должна остаться
   - Создайте дубликаты с новыми slug (например: `skill-ui`, `reference-ui`)
   - Обновите данные в таблице `data`

2. **При создании новых slug:**
   - Используйте формат: `{group_slug}-{subgroup_slug}`
   - Пример: `skill-ui`, `reference-ui`, `designsystem-ui`

3. **Миграция данных:**
   - Сначала создайте новые записи в `subgroups` с новыми slug
   - Затем обновите `data.subgroup_slug` для соответствующих карточек
   - Удалите старые подгруппы, если они больше не используются

