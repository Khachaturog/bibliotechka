-- Замена путей к обложкам в таблице data (текстовые поля)
-- /images/covers -> https://35401aca832c.hosting.myjino.ru/images/covers
--
-- Примечание: cover_short и cover_large задаются миграцией 019 (из slug).
-- При смене базового URL обновляйте их отдельным скриптом.
--
-- ⚠️ ВАЖНО: Сначала сделайте бэкап!

USE bibliotechka;

-- ============================================================================
-- ШАГ 1: ПРЕДПРОСМОТР - Текстовые поля (description, detail, comment, summary_ai)
-- ============================================================================

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

-- ============================================================================
-- ШАГ 2: ВЫПОЛНИТЬ ЗАМЕНУ
-- ============================================================================

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
-- ШАГ 3: ПРОВЕРКА
-- ============================================================================

SELECT 
    'description' as field,
    COUNT(*) as still_remaining
FROM `data`
WHERE `description` LIKE '%/images/covers%'
  AND `description` NOT LIKE 'https://%'
UNION ALL
SELECT 
    'detail' as field,
    COUNT(*) as still_remaining
FROM `data`
WHERE `detail` LIKE '%/images/covers%'
  AND `detail` NOT LIKE 'https://%'
UNION ALL
SELECT 
    'comment' as field,
    COUNT(*) as still_remaining
FROM `data`
WHERE `comment` LIKE '%/images/covers%'
  AND `comment` NOT LIKE 'https://%'
UNION ALL
SELECT 
    'summary_ai' as field,
    COUNT(*) as still_remaining
FROM `data`
WHERE `summary_ai` LIKE '%/images/covers%'
  AND `summary_ai` NOT LIKE 'https://%';
