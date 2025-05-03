-- Добавляем колонку short_id в таблицу resources
ALTER TABLE resources ADD COLUMN short_id TEXT;

-- Создаем функцию для генерации короткого ID
CREATE OR REPLACE FUNCTION generate_short_id() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER := 0;
  random_index INTEGER;
BEGIN
  -- Генерируем случайную строку из 8 символов
  FOR i IN 1..8 LOOP
    random_index := 1 + floor(random() * length(chars));
    result := result || substr(chars, random_index, 1);
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Заполняем short_id для всех существующих ресурсов
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM resources WHERE short_id IS NULL LOOP
    UPDATE resources SET short_id = generate_short_id() WHERE id = r.id;
  END LOOP;
END $$;

-- Создаем уникальный индекс для short_id
CREATE UNIQUE INDEX idx_resources_short_id ON resources(short_id);

-- Создаем триггер для автоматического заполнения short_id при добавлении новых ресурсов
CREATE OR REPLACE FUNCTION set_resource_short_id() RETURNS TRIGGER AS $$
DECLARE
  new_short_id TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Генерируем новый short_id
    new_short_id := generate_short_id();
    
    -- Проверяем, что такого short_id еще нет
    SELECT COUNT(*) INTO exists_count FROM resources WHERE short_id = new_short_id;
    
    -- Если такого short_id нет, используем его
    IF exists_count = 0 THEN
      NEW.short_id := new_short_id;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_resource_short_id
BEFORE INSERT ON resources
FOR EACH ROW
WHEN (NEW.short_id IS NULL)
EXECUTE FUNCTION set_resource_short_id();
