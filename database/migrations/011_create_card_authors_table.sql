-- Миграция: Создание таблицы card_authors
-- Связующая таблица для связи карточек (data) и авторов (authors)
-- Одна карточка может иметь несколько авторов (many-to-many)

USE bibliotechka;

CREATE TABLE IF NOT EXISTS `card_authors` (
  `card_slug` VARCHAR(255) NOT NULL,
  `author_slug` VARCHAR(255) NOT NULL,
  `created_at_db` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`card_slug`, `author_slug`),
  INDEX `idx_card_slug` (`card_slug`),
  INDEX `idx_author_slug` (`author_slug`),
  CONSTRAINT `fk_card_authors_card` FOREIGN KEY (`card_slug`) REFERENCES `data` (`slug`) ON DELETE CASCADE,
  CONSTRAINT `fk_card_authors_author` FOREIGN KEY (`author_slug`) REFERENCES `authors` (`slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

