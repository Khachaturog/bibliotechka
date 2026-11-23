-- Миграция 018: Дополнительные индексы для оптимизации сортировки
-- Исправление проблем с filesort в запросах

-- Индекс для сортировки групп по sort
SET @index_exists = (
    SELECT COUNT(1) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'groups' 
    AND INDEX_NAME = 'idx_sort_groups'
);

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE `groups` ADD INDEX `idx_sort_groups` (`sort`)',
    'SELECT "Индекс idx_sort_groups уже существует, пропускаем" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Индекс для сортировки подгрупп по title_ru (используется в запросе всех подгрупп)
SET @index_exists = (
    SELECT COUNT(1) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'subgroups' 
    AND INDEX_NAME = 'idx_title_ru'
);

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE `subgroups` ADD INDEX `idx_title_ru` (`title_ru`)',
    'SELECT "Индекс idx_title_ru уже существует, пропускаем" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Композитный индекс для subgroups: group_slug + sort + title_ru (для запроса с фильтрацией и сортировкой)
SET @index_exists = (
    SELECT COUNT(1) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'subgroups' 
    AND INDEX_NAME = 'idx_group_sort_title'
);

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE `subgroups` ADD INDEX `idx_group_sort_title` (`group_slug`, `sort`, `title_ru`)',
    'SELECT "Индекс idx_group_sort_title уже существует, пропускаем" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

