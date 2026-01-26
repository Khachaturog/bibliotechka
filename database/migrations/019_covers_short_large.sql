-- Миграция 019: cover_short / cover_large, удаление cover и cover_notion
--
-- ⚠️ ПЕРЕД ВЫПОЛНЕНИЕМ ОБЯЗАТЕЛЬНО СДЕЛАЙТЕ БЭКАП:
--    bash scripts/create-backup-019.sh
--    или  php scripts/backup-019.php
--    или  mysqldump -h HOST -u USER -p DB > backups/backup_before_migration_019_YYYYMMDD_HHMMSS.sql
--
-- Что делает:
-- - В data: добавляет cover_short, cover_large; заполняет из slug; удаляет cover и cover_notion.
-- - В groups: удаляет cover_notion.

-- 1. Добавляем колонки в data
ALTER TABLE `data`
  ADD COLUMN `cover_short` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '' AFTER `cover`,
  ADD COLUMN `cover_large` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '' AFTER `cover_short`;

-- 2. Заполняем из slug
UPDATE `data`
SET
  `cover_short` = CONCAT('https://35401aca832c.hosting.myjino.ru/bibliotechka/short/', `slug`, '.webp'),
  `cover_large` = CONCAT('https://35401aca832c.hosting.myjino.ru/bibliotechka/large/', `slug`, '.webp');

-- 3. Удаляем старые колонки в data
ALTER TABLE `data` DROP COLUMN `cover_notion`;
ALTER TABLE `data` DROP COLUMN `cover`;

-- 4. Удаляем cover_notion в groups
ALTER TABLE `groups` DROP COLUMN `cover_notion`;
