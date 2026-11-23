-- Удаление резервной копии card_authors_backup_20251223
-- Выполнить только если миграция прошла успешно и бэкап больше не нужен

USE bibliotechka;

-- Проверка перед удалением
SELECT 
    'Записей в основной таблице' as info,
    COUNT(*) as count
FROM card_authors;

SELECT 
    'Записей в бэкапе' as info,
    COUNT(*) as count
FROM card_authors_backup_20251223;

-- Удаление резервной копии
DROP TABLE IF EXISTS card_authors_backup_20251223;

-- Проверка удаления
SELECT 'Резервная копия удалена' as info;

