-- Замена путей к обложкам в таблице data
-- /images/covers -> https://35401aca832c.hosting.myjino.ru/images/covers
--
-- ⚠️ ВАЖНО: Сначала сделайте бэкап!

USE bibliotechka;

-- ============================================================================
-- ШАГ 1: ПРЕДПРОСМОТР - Посмотреть, сколько записей будет затронуто
-- ============================================================================

-- Проверяем поле cover
SELECT 
    'cover' as field,
    COUNT(*) as total_found
FROM `data`
WHERE `cover` LIKE '%/images/covers%';

-- Проверяем поле cover_notion
SELECT 
    'cover_notion' as field,
    COUNT(*) as total_found
FROM `data`
WHERE `cover_notion` LIKE '%/images/covers%';

-- Проверяем другие поля (description, detail, comment, summary_ai)
SELECT 
    'description' as field,
    COUNT(*) as total_found
FROM `data`
WHERE `description` LIKE '%/images/covers%'
UNION ALL
SELECT 
    'detail' as field,
    COUNT(*) as total_found
FROM `data`
WHERE `detail` LIKE '%/images/covers%'
UNION ALL
SELECT 
    'comment' as field,
    COUNT(*) as total_found
FROM `data`
WHERE `comment` LIKE '%/images/covers%'
UNION ALL
SELECT 
    'summary_ai' as field,
    COUNT(*) as total_found
FROM `data`
WHERE `summary_ai` LIKE '%/images/covers%';

-- Показать примеры из cover
SELECT 
    slug,
    cover as old_cover,
    REPLACE(cover, '/images/covers', 'https://35401aca832c.hosting.myjino.ru/images/covers') as new_cover
FROM `data`
WHERE `cover` LIKE '%/images/covers%'
LIMIT 10;

-- ============================================================================
-- ШАГ 2: ВЫПОЛНИТЬ ЗАМЕНУ
-- ============================================================================

-- Замена в поле cover
UPDATE `data` 
SET `cover` = REPLACE(`cover`, '/images/covers', 'https://35401aca832c.hosting.myjino.ru/images/covers')
WHERE `cover` LIKE '%/images/covers%';

-- Замена в поле cover_notion
UPDATE `data` 
SET `cover_notion` = REPLACE(`cover_notion`, '/images/covers', 'https://35401aca832c.hosting.myjino.ru/images/covers')
WHERE `cover_notion` LIKE '%/images/covers%';

-- Замена в текстовых полях (если нужно)
UPDATE `data` 
SET `description` = REPLACE(`description`, '/images/covers', 'https://35401aca832c.hosting.myjino.ru/images/covers')
WHERE `description` LIKE '%/images/covers%';

UPDATE `data` 
SET `detail` = REPLACE(`detail`, '/images/covers', 'https://35401aca832c.hosting.myjino.ru/images/covers')
WHERE `detail` LIKE '%/images/covers%';

UPDATE `data` 
SET `comment` = REPLACE(`comment`, '/images/covers', 'https://35401aca832c.hosting.myjino.ru/images/covers')
WHERE `comment` LIKE '%/images/covers%';

UPDATE `data` 
SET `summary_ai` = REPLACE(`summary_ai`, '/images/covers', 'https://35401aca832c.hosting.myjino.ru/images/covers')
WHERE `summary_ai` LIKE '%/images/covers%';

-- ============================================================================
-- ШАГ 3: ПРОВЕРКА - Убедиться, что замена прошла успешно
-- ============================================================================

-- Проверить, остались ли записи со старым путём
SELECT 
    'cover' as field,
    COUNT(*) as still_remaining
FROM `data`
WHERE `cover` LIKE '%/images/covers%'
  AND `cover` NOT LIKE 'https://%'
UNION ALL
SELECT 
    'cover_notion' as field,
    COUNT(*) as still_remaining
FROM `data`
WHERE `cover_notion` LIKE '%/images/covers%'
  AND `cover_notion` NOT LIKE 'https://%';

-- Показать несколько примеров результата
SELECT 
    slug,
    cover,
    cover_notion
FROM `data`
WHERE `cover` LIKE 'https://35401aca832c.hosting.myjino.ru/images/covers%'
   OR `cover_notion` LIKE 'https://35401aca832c.hosting.myjino.ru/images/covers%'
LIMIT 5;

