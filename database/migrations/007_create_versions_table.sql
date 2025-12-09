-- Миграция: Создание таблицы versions
-- Таблица для хранения информации о версиях/релизах проекта

USE bibliotechka;

CREATE TABLE IF NOT EXISTS `versions` (
  `slug` VARCHAR(255) NOT NULL PRIMARY KEY,
  `version` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `release_date` VARCHAR(255),
  `url` VARCHAR(500),
  `created_at_db` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at_db` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

