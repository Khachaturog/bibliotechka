-- Добавляем колонку slug в таблицу resources
ALTER TABLE resources ADD COLUMN slug TEXT;

-- Создаем функцию для генерации slug из заголовка
CREATE OR REPLACE FUNCTION generate_slug(title TEXT) RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Преобразуем в нижний регистр
  result := LOWER(title);
  
  -- Заменяем кириллические символы на латинские (простая транслитерация)
  result := REPLACE(result, 'а', 'a');
  result := REPLACE(result, 'б', 'b');
  result := REPLACE(result, 'в', 'v');
  result := REPLACE(result, 'г', 'g');
  result := REPLACE(result, 'д', 'd');
  result := REPLACE(result, 'е', 'e');
  result := REPLACE(result, 'ё', 'yo');
  result := REPLACE(result, 'ж', 'zh');
  result := REPLACE(result, 'з', 'z');
  result := REPLACE(result, 'и', 'i');
  result := REPLACE(result, 'й', 'y');
  result := REPLACE(result, 'к', 'k');
  result := REPLACE(result, 'л', 'l');
  result := REPLACE(result, 'м', 'm');
  result := REPLACE(result, 'н', 'n');
  result := REPLACE(result, 'о', 'o');
  result := REPLACE(result, 'п', 'p');
  result := REPLACE(result, 'р', 'r');
  result := REPLACE(result, 'с', 's');
  result := REPLACE(result, 'т', 't');
  result := REPLACE(result, 'у', 'u');
  result := REPLACE(result, 'ф', 'f');
  result := REPLACE(result, 'х', 'h');
  result := REPLACE(result, 'ц', 'ts');
  result := REPLACE(result, 'ч', 'ch');
  result := REPLACE(result, 'ш', 'sh');
  result := REPLACE(result, 'щ', 'sch');
  result := REPLACE(result, 'ъ', '');
  result := REPLACE(result, 'ы', 'y');
  result := REPLACE(result, 'ь', '');
  result := REPLACE(result, 'э', 'e');
  result := REPLACE(result, 'ю', 'yu');
  result := REPLACE(result, 'я', 'ya');
  
  -- Заменяем все не-алфавитно-цифровые символы на дефисы
  result := REGEXP_REPLACE(result, '[^a-z0-9]+', '-', 'g');
  
  -- Удаляем дефисы в начале и конце строки
  result := TRIM(BOTH '-' FROM result);
  
  -- Заменяем множественные дефисы на один
  result := REGEXP_REPLACE(result, '-+', '-', 'g');
  
  -- Добавляем случайную строку для уникальности
  result := result || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Заполняем slug для всех существующих ресурсов
UPDATE resources SET slug = generate_slug(title) WHERE slug IS NULL;

-- Создаем уникальный индекс для slug
CREATE UNIQUE INDEX idx_resources_slug ON resources(slug);

-- Создаем триггер для автоматического заполнения slug при добавлении новых ресурсов
CREATE OR REPLACE FUNCTION set_resource_slug() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_resource_slug
BEFORE INSERT ON resources
FOR EACH ROW
EXECUTE FUNCTION set_resource_slug();
