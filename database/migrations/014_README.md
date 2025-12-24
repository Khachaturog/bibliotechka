# Миграция 014: Обновление таблицы subgroups

## Что делает миграция

1. ✅ Добавляет колонку `group_slug` в таблицу `subgroups`
2. ✅ Добавляет колонку `sort` для сортировки подгрупп в рамках группы
3. ✅ Обновляет `slug` на формат `group-subgroup` (например: `skill-ui`, `reference-other`)
4. ✅ Создаёт дубликаты подгрупп для каждой группы (если подгруппа использовалась в нескольких группах)
5. ✅ Обновляет все ссылки в таблице `data` на новые slug
6. ✅ Удаляет старые записи подгрупп, которые больше не используются

## Перед выполнением

⚠️ **ОБЯЗАТЕЛЬНО сделайте бэкап базы данных!**

```bash
mysqldump -u root -p bibliotechka > backup_before_014.sql
```

## Выполнение миграции

```bash
mysql -u root -p bibliotechka < database/migrations/014_add_group_and_sort_to_subgroups.sql
```

Или через MySQL клиент:

```sql
SOURCE database/migrations/014_add_group_and_sort_to_subgroups.sql;
```

## После миграции

### 1. Проверьте результаты

```sql
-- Проверить, что все подгруппы имеют group_slug
SELECT COUNT(*) as without_group 
FROM subgroups 
WHERE group_slug IS NULL;
-- Должно быть 0

-- Проверить формат slug
SELECT slug FROM subgroups WHERE slug NOT LIKE '%-%' LIMIT 10;
-- Не должно быть записей (или только системные)

-- Статистика по группам
SELECT 
    group_slug,
    COUNT(*) as subgroups_count
FROM subgroups
GROUP BY group_slug
ORDER BY group_slug;
```

### 2. Обновите порядок сортировки (опционально)

```sql
-- Пример для группы skill
UPDATE subgroups SET sort = 1 WHERE slug = 'skill-ui' AND group_slug = 'skill';
UPDATE subgroups SET sort = 2 WHERE slug = 'skill-ux' AND group_slug = 'skill';
UPDATE subgroups SET sort = 3 WHERE slug = 'skill-knowledge' AND group_slug = 'skill';
-- и т.д.
```

### 3. Обновите API (если нужно)

Теперь запросы должны учитывать `group_slug`:

```php
// Получить подгруппы для группы
SELECT * FROM subgroups 
WHERE group_slug = 'skill' 
ORDER BY sort, title_ru;
```

## Откат

Если что-то пошло не так, восстановите из бэкапа:

```bash
mysql -u root -p bibliotechka < backup_before_014.sql
```

## Примеры данных после миграции

| slug | title_ru | group_slug | sort |
|------|----------|------------|------|
| skill-ui | UI | skill | 0 |
| trainer-ui | UI | trainer | 0 |
| designsystem-text | Тексты | designsystem | 0 |
| reference-other | Разное | reference | 0 |
| books-other | Разное | books | 0 |

