-- Миграция 017: Оптимизация производительности
-- Добавление критических индексов для ускорения запросов
-- 
-- Безопасно для повторного выполнения: проверяет наличие индексов перед добавлением

-- Проверяем и добавляем индекс для поиска карточек по url_seo_yandex
SET @index_exists = (
    SELECT COUNT(1) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'data' 
    AND INDEX_NAME = 'idx_url_seo_yandex'
);

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE `data` ADD INDEX `idx_url_seo_yandex` (`url_seo_yandex`)',
    'SELECT "Индекс idx_url_seo_yandex уже существует, пропускаем" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Проверяем и добавляем композитный индекс для часто используемых фильтров
SET @index_exists = (
    SELECT COUNT(1) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'data' 
    AND INDEX_NAME = 'idx_status_group'
);

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE `data` ADD INDEX `idx_status_group` (`status_slug`, `group_slug`)',
    'SELECT "Индекс idx_status_group уже существует, пропускаем" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

