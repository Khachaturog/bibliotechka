-- Миграция: Возврат колонок URL обратно к VARCHAR(500)
-- URL больше не превышают 500 символов, нет необходимости в TEXT

USE bibliotechka;

-- Возвращаем колонки url_1 до url_6 обратно к VARCHAR(500)
ALTER TABLE `data` 
  MODIFY COLUMN `url_1` VARCHAR(500),
  MODIFY COLUMN `url_2` VARCHAR(500),
  MODIFY COLUMN `url_3` VARCHAR(500),
  MODIFY COLUMN `url_4` VARCHAR(500),
  MODIFY COLUMN `url_5` VARCHAR(500),
  MODIFY COLUMN `url_6` VARCHAR(500);

-- Возвращаем SEO URL колонки обратно к VARCHAR(500)
ALTER TABLE `data`
  MODIFY COLUMN `url_seo_yandex` VARCHAR(500),
  MODIFY COLUMN `url_seo_google` VARCHAR(500);

