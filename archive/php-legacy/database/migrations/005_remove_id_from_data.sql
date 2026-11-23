-- Миграция: Удаление колонки id из таблицы data
-- Делаем slug первичным ключом (как в таблицах groups и subgroups)

USE bibliotechka;

-- Сначала убираем AUTO_INCREMENT с id
ALTER TABLE `data` MODIFY COLUMN `id` INT NOT NULL;

-- Удаляем PRIMARY KEY с id
ALTER TABLE `data` DROP PRIMARY KEY;

-- Удаляем UNIQUE KEY с slug (чтобы потом сделать его PRIMARY KEY)
ALTER TABLE `data` DROP INDEX `slug`;

-- Делаем slug PRIMARY KEY
ALTER TABLE `data` ADD PRIMARY KEY (`slug`);

-- Удаляем колонку id
ALTER TABLE `data` DROP COLUMN `id`;

