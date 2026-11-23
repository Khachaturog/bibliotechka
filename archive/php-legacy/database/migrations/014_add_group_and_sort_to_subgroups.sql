
-- Миграция 014: Добавление group_slug и sort в subgroups, обновление slug на формат group-subgroup
-- 
-- Цель: 
-- 1. Добавить колонку group_slug для привязки подгруппы к группе
-- 2. Добавить колонку sort для сортировки подгрупп в рамках группы
-- 3. Обновить slug на формат "group-subgroup" для уникальности
-- 4. Создать дубликаты подгрупп, которые используются в нескольких группах
--
-- Дата: 2025-12-14

-- Примечание: USE не используется, база данных указывается при подключении
-- Отключаем проверку внешних ключей на время миграции
SET FOREIGN_KEY_CHECKS = 0;

-- Шаг 1: Добавляем новые колонки в таблицу subgroups
ALTER TABLE `subgroups` 
  ADD COLUMN `group_slug` VARCHAR(255) COLLATE utf8mb4_unicode_ci NULL AFTER `status`,
  ADD COLUMN `sort` INT DEFAULT 0 AFTER `group_slug`,
  ADD INDEX `idx_group_slug` (`group_slug`),
  ADD INDEX `idx_group_sort` (`group_slug`, `sort`);

-- Шаг 2: Создаём временную таблицу для маппинга старых slug -> новых slug
CREATE TEMPORARY TABLE `temp_subgroup_mapping` (
  `old_slug` VARCHAR(255) NOT NULL,
  `new_slug` VARCHAR(255) NOT NULL,
  `group_slug` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`old_slug`, `group_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Шаг 3: Заполняем маппинг на основе данных из таблицы data
-- Для каждой уникальной комбинации group_slug + subgroup_slug создаём запись
INSERT INTO `temp_subgroup_mapping` (`old_slug`, `new_slug`, `group_slug`)
SELECT DISTINCT
    d.subgroup_slug as old_slug,
    CONCAT(d.group_slug, '-', d.subgroup_slug) as new_slug,
    d.group_slug
FROM `data` d
WHERE d.group_slug IS NOT NULL 
  AND d.subgroup_slug IS NOT NULL
ORDER BY d.group_slug, d.subgroup_slug;

-- Шаг 4: Создаём дубликаты подгрупп для каждой группы
-- Для каждой уникальной комбинации group + subgroup создаём новую запись в subgroups
INSERT INTO `subgroups` (`slug`, `title_ru`, `title_en`, `description_ru`, `status`, `group_slug`, `sort`)
SELECT DISTINCT
    tsm.new_slug as slug,
    s.title_ru,
    s.title_en,
    s.description_ru,
    s.status,
    tsm.group_slug,
    0 as sort  -- По умолчанию sort = 0, можно будет обновить вручную
FROM `temp_subgroup_mapping` tsm
INNER JOIN `subgroups` s ON tsm.old_slug = s.slug
WHERE NOT EXISTS (
    SELECT 1 FROM `subgroups` s2 
    WHERE s2.slug = tsm.new_slug
)
ON DUPLICATE KEY UPDATE 
    `title_ru` = VALUES(`title_ru`),
    `title_en` = VALUES(`title_en`),
    `description_ru` = VALUES(`description_ru`),
    `status` = VALUES(`status`);

-- Шаг 5: Обновляем данные в таблице data - заменяем старые subgroup_slug на новые
-- ВАЖНО: Обновляем ВСЕ записи, которые есть в маппинге
UPDATE `data` d
INNER JOIN `temp_subgroup_mapping` tsm 
    ON d.subgroup_slug = tsm.old_slug 
    AND d.group_slug = tsm.group_slug
SET d.subgroup_slug = tsm.new_slug;

-- Шаг 6: НЕ удаляем старые записи автоматически!
-- Старые записи (не в формате group-subgroup) остаются в таблице для безопасности
-- Их можно будет удалить вручную после проверки, что всё работает корректно
-- 
-- Для ручного удаления (после проверки) можно использовать:
-- DELETE FROM `subgroups` 
-- WHERE `slug` NOT LIKE '%-%' 
--   AND `slug` NOT IN (SELECT DISTINCT subgroup_slug FROM `data`);

-- Шаг 7: Обновляем внешний ключ в таблице data
-- Сначала удаляем старый внешний ключ (если существует)
-- Проверяем существование через информацию о схеме
-- Используем DATABASE() для получения текущей базы данных
SET @fk_name = (
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'data' 
      AND COLUMN_NAME = 'subgroup_slug' 
      AND REFERENCED_TABLE_NAME = 'subgroups'
    LIMIT 1
);

SET @sql = IF(@fk_name IS NOT NULL, 
    CONCAT('ALTER TABLE `data` DROP FOREIGN KEY `', @fk_name, '`'), 
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Добавляем новый внешний ключ
ALTER TABLE `data`
  ADD CONSTRAINT `fk_data_subgroup` 
  FOREIGN KEY (`subgroup_slug`) 
  REFERENCES `subgroups` (`slug`) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- Шаг 8: Делаем group_slug обязательным и добавляем внешний ключ
ALTER TABLE `subgroups`
  MODIFY COLUMN `group_slug` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  ADD CONSTRAINT `fk_subgroups_group` 
  FOREIGN KEY (`group_slug`) 
  REFERENCES `groups` (`slug`) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- Шаг 9: Удаляем временную таблицу
DROP TEMPORARY TABLE IF EXISTS `temp_subgroup_mapping`;

-- Включаем проверку внешних ключей обратно
SET FOREIGN_KEY_CHECKS = 1;

-- Проверка: выводим статистику
-- SELECT 
--     s.group_slug,
--     COUNT(*) as subgroups_count,
--     GROUP_CONCAT(s.slug ORDER BY s.sort, s.title_ru SEPARATOR ', ') as subgroups_list
-- FROM subgroups s
-- GROUP BY s.group_slug
-- ORDER BY s.group_slug;

