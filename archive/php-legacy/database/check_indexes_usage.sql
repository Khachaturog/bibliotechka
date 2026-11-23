-- Проверка использования индексов в запросах

-- 1. Проверяем индексы на таблице data
EXPLAIN SELECT * FROM data WHERE url_seo_yandex = 'kolor-070';

EXPLAIN SELECT slug, title, cover, description, 
       group_slug, subgroup_slug, status_slug,
       url_seo_yandex
FROM data
WHERE status_slug = 'published' AND group_slug = 'trainer'
ORDER BY slug;

-- 2. Проверяем индексы на таблице subgroups
EXPLAIN SELECT * FROM subgroups WHERE group_slug = 'trainer' ORDER BY sort, title_ru;

EXPLAIN SELECT * FROM subgroups ORDER BY title_ru;

-- 3. Проверяем индексы на таблице groups
EXPLAIN SELECT * FROM groups WHERE slug = 'trainer';

EXPLAIN SELECT slug, title_ru, cover, description_ru, sort 
FROM groups 
ORDER BY sort;

