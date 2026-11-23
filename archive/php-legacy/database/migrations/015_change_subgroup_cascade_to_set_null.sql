-- Миграция 015: Изменение каскадного удаления групп и подгрупп на SET NULL
-- 
-- Цель: 
-- 1. Изменить поведение при удалении подгруппы: вместо удаления карточек,
--    поле subgroup_slug в таблице data будет устанавливаться в NULL
-- 2. Изменить поведение при удалении группы: вместо удаления карточек,
--    поле group_slug в таблице data будет устанавливаться в NULL
-- 3. Изменить поведение при удалении группы: вместо удаления подгрупп,
--    поле group_slug в таблице subgroups будет устанавливаться в NULL
-- 4. Разрешить NULL значения в полях subgroup_slug, group_slug (data) и group_slug (subgroups)
--
-- Дата: 2025-12-19

-- Примечание: USE не используется, база данных указывается при подключении
-- Отключаем проверку внешних ключей на время миграции
SET FOREIGN_KEY_CHECKS = 0;

-- Шаг 1: Удаляем внешний ключ для subgroup_slug
SET @fk_name_subgroup = (
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'data' 
      AND COLUMN_NAME = 'subgroup_slug' 
      AND REFERENCED_TABLE_NAME = 'subgroups'
    LIMIT 1
);

SET @sql = IF(@fk_name_subgroup IS NOT NULL, 
    CONCAT('ALTER TABLE `data` DROP FOREIGN KEY `', @fk_name_subgroup, '`'), 
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Шаг 2: Удаляем внешний ключ для group_slug в таблице data
SET @fk_name_group = (
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'data' 
      AND COLUMN_NAME = 'group_slug' 
      AND REFERENCED_TABLE_NAME = 'groups'
    LIMIT 1
);

SET @sql = IF(@fk_name_group IS NOT NULL, 
    CONCAT('ALTER TABLE `data` DROP FOREIGN KEY `', @fk_name_group, '`'), 
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Шаг 2.5: Удаляем внешний ключ для group_slug в таблице subgroups
SET @fk_name_subgroups_group = (
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'subgroups' 
      AND COLUMN_NAME = 'group_slug' 
      AND REFERENCED_TABLE_NAME = 'groups'
    LIMIT 1
);

SET @sql = IF(@fk_name_subgroups_group IS NOT NULL, 
    CONCAT('ALTER TABLE `subgroups` DROP FOREIGN KEY `', @fk_name_subgroups_group, '`'), 
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Шаг 3: Изменяем колонку subgroup_slug, чтобы разрешить NULL значения
ALTER TABLE `data`
  MODIFY COLUMN `subgroup_slug` varchar(255) COLLATE utf8mb4_unicode_ci NULL;

-- Шаг 4: Изменяем колонку group_slug в таблице data, чтобы разрешить NULL значения
ALTER TABLE `data`
  MODIFY COLUMN `group_slug` varchar(255) COLLATE utf8mb4_unicode_ci NULL;

-- Шаг 4.5: Изменяем колонку group_slug в таблице subgroups, чтобы разрешить NULL значения
ALTER TABLE `subgroups`
  MODIFY COLUMN `group_slug` varchar(255) COLLATE utf8mb4_unicode_ci NULL;

-- Шаг 5: Добавляем новый внешний ключ для subgroup_slug с ON DELETE SET NULL
ALTER TABLE `data`
  ADD CONSTRAINT `data_ibfk_2` 
  FOREIGN KEY (`subgroup_slug`) 
  REFERENCES `subgroups` (`slug`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Шаг 6: Добавляем новый внешний ключ для group_slug в таблице data с ON DELETE SET NULL
ALTER TABLE `data`
  ADD CONSTRAINT `data_ibfk_1` 
  FOREIGN KEY (`group_slug`) 
  REFERENCES `groups` (`slug`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Шаг 7: Добавляем новый внешний ключ для group_slug в таблице subgroups с ON DELETE SET NULL
ALTER TABLE `subgroups`
  ADD CONSTRAINT `fk_subgroups_group` 
  FOREIGN KEY (`group_slug`) 
  REFERENCES `groups` (`slug`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Включаем проверку внешних ключей обратно
SET FOREIGN_KEY_CHECKS = 1;

-- Проверка: выводим информацию о внешних ключах таблицы data
-- SELECT 
--     CONSTRAINT_NAME,
--     COLUMN_NAME,
--     REFERENCED_TABLE_NAME,
--     REFERENCED_COLUMN_NAME,
--     DELETE_RULE,
--     UPDATE_RULE
-- FROM information_schema.KEY_COLUMN_USAGE kcu
-- JOIN information_schema.REFERENTIAL_CONSTRAINTS rc 
--     ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME 
--     AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
-- WHERE kcu.TABLE_SCHEMA = DATABASE()
--   AND kcu.TABLE_NAME = 'data'
--   AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
-- ORDER BY kcu.CONSTRAINT_NAME;

SELECT 'Миграция 015 завершена: все связи с groups используют ON DELETE SET NULL (data.group_slug, data.subgroup_slug, subgroups.group_slug)' as status;

