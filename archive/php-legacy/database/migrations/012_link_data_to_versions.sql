-- Миграция: Связь таблиц data и versions через внешний ключ
-- data.version_slug → versions.slug

USE bibliotechka;

-- Сначала преобразуем version_slug из INT в VARCHAR(255) для соответствия versions.slug
-- Преобразуем числовые значения в строки
UPDATE `data` SET `version_slug` = CAST(`version_slug` AS CHAR) WHERE `version_slug` IS NOT NULL;

-- Изменяем тип колонки version_slug с INT на VARCHAR(255)
ALTER TABLE `data` MODIFY COLUMN `version_slug` VARCHAR(255);

-- Добавляем внешний ключ
ALTER TABLE `data` 
  ADD CONSTRAINT `fk_data_version` 
  FOREIGN KEY (`version_slug`) 
  REFERENCES `versions` (`slug`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

