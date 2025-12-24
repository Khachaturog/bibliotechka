-- Инициализация базы данных Библиотечка
-- 
-- ВАЖНО: Этот файл выполняется ТОЛЬКО при первом создании базы данных
-- (когда volume пустой). При перезапуске контейнера данные сохраняются.
-- 
-- ⚠️ ПРЕДУПРЕЖДЕНИЕ: 
-- - Если удалить volume (docker volume rm), все данные будут потеряны
-- - Перед удалением volume сделайте бекап: docker exec bibliotechka-mysql mysqldump ...
-- - Все таблицы создаются с IF NOT EXISTS - безопасно для повторного выполнения
--
-- Создаёт все необходимые таблицы с правильной структурой
-- Использует IF NOT EXISTS для защиты существующих данных

USE bibliotechka;

-- Отключаем проверку внешних ключей на время создания таблиц
-- (на случай, если таблицы создаются в неправильном порядке)
SET FOREIGN_KEY_CHECKS = 0;

-- Таблица groups (Группы)
CREATE TABLE IF NOT EXISTS `groups` (
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ru` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `badge` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `cover` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `cover_notion` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `description_ru` text COLLATE utf8mb4_unicode_ci,
  `description_seo` text COLLATE utf8mb4_unicode_ci,
  `keywords_seo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `og_description` text COLLATE utf8mb4_unicode_ci,
  `og_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `og_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `sort` int DEFAULT '0',
  `title_seo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`slug`),
  KEY `idx_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица subgroups (Подгруппы)
CREATE TABLE IF NOT EXISTS `subgroups` (
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ru` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `description_ru` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `group_slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort` int DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`slug`),
  KEY `idx_group_slug` (`group_slug`),
  KEY `idx_group_sort` (`group_slug`,`sort`),
  CONSTRAINT `fk_subgroups_group` FOREIGN KEY (`group_slug`) REFERENCES `groups` (`slug`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица versions (Версии/релизы)
-- Создается ПЕРЕД data, так как data имеет внешний ключ на versions
CREATE TABLE IF NOT EXISTS `versions` (
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `release_date` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at_db` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at_db` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица authors (Авторы)
-- Создается ПЕРЕД card_authors, так как card_authors имеет внешний ключ на authors
CREATE TABLE IF NOT EXISTS `authors` (
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ru` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at_db` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at_db` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица data (Элементы/карточки)
-- Создается ПОСЛЕ groups, subgroups и versions (имеет внешние ключи на них)
CREATE TABLE IF NOT EXISTS `data` (
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cover` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `cover_notion` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `url_seo_yandex` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url_seo_google` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `author_slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `status_slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `group_slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subgroup_slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url_title_1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `url_1` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url_title_2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `url_2` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url_title_3` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `url_3` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url_title_4` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `url_4` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url_title_5` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `url_5` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url_title_6` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `url_6` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `end_date` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `published` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `created_at` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `updated_at` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `summary_ai` text COLLATE utf8mb4_unicode_ci,
  `detail` text COLLATE utf8mb4_unicode_ci,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `version_slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at_db` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at_db` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`slug`),
  KEY `idx_group_slug` (`group_slug`),
  KEY `idx_subgroup_slug` (`subgroup_slug`),
  KEY `idx_status_slug` (`status_slug`),
  KEY `idx_group_subgroup` (`group_slug`,`subgroup_slug`),
  KEY `idx_version_slug` (`version_slug`),
  CONSTRAINT `data_ibfk_1` FOREIGN KEY (`group_slug`) REFERENCES `groups` (`slug`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `data_ibfk_2` FOREIGN KEY (`subgroup_slug`) REFERENCES `subgroups` (`slug`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_data_version` FOREIGN KEY (`version_slug`) REFERENCES `versions` (`slug`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица card_authors (Связь карточек и авторов)
-- Создается ПОСЛЕ data и authors (имеет внешние ключи на них)
CREATE TABLE IF NOT EXISTS `card_authors` (
  `card_slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author_slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at_db` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`card_slug`,`author_slug`),
  KEY `idx_card_slug` (`card_slug`),
  KEY `idx_author_slug` (`author_slug`),
  CONSTRAINT `fk_card_authors_author` FOREIGN KEY (`author_slug`) REFERENCES `authors` (`slug`) ON DELETE CASCADE,
  CONSTRAINT `fk_card_authors_card` FOREIGN KEY (`card_slug`) REFERENCES `data` (`slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Включаем проверку внешних ключей обратно
SET FOREIGN_KEY_CHECKS = 1;

-- Проверка: выводим информацию о созданных таблицах
-- (только для отладки, можно закомментировать в продакшене)
-- SELECT 
--   TABLE_NAME as 'Таблица',
--   TABLE_ROWS as 'Записей'
-- FROM information_schema.TABLES 
-- WHERE TABLE_SCHEMA = 'bibliotechka' 
-- ORDER BY TABLE_NAME;

