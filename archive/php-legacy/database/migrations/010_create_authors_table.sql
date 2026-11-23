-- Миграция: Создание таблицы authors
-- Таблица для хранения информации об авторах

USE bibliotechka;

CREATE TABLE IF NOT EXISTS `authors` (
  `slug` VARCHAR(255) NOT NULL PRIMARY KEY,
  `title_ru` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255),
  `avatar` VARCHAR(500),
  `created_at_db` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at_db` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

