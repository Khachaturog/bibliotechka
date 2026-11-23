-- Быстрое создание резервной копии card_authors
-- Выполнить: mysql -h HOST -u USER -p DATABASE < scripts/quick-backup-card-authors.sql

USE bibliotechka;

-- Создаем резервную копию
CREATE TABLE IF NOT EXISTS card_authors_backup_$(date +%Y%m%d_%H%M%S) AS 
SELECT * FROM card_authors;

-- Показываем количество записей в бэкапе
SELECT 
    'Резервная копия создана' as info,
    COUNT(*) as backup_count
FROM card_authors_backup_$(date +%Y%m%d_%H%M%S);

-- Показываем количество записей в оригинале
SELECT 
    'Записей в оригинале' as info,
    COUNT(*) as original_count
FROM card_authors;

