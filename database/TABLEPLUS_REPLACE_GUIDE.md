# Как делать Find and Replace в TablePlus

## Почему Find and Replace может быть недоступен?

TablePlus ограничивает функцию Find and Replace по следующим причинам:

1. **Ограничения бесплатной версии** - массовая замена может требовать Pro версию
2. **Режим только чтения** - при подключении к серверной БД может не хватать прав
3. **Защита данных** - TablePlus требует явного подтверждения для массовых изменений
4. **Типы данных** - функция может работать не для всех типов полей (TEXT, BLOB и т.д.)

## ✅ Решение: Использовать SQL напрямую

**Это лучше и надежнее!** SQL дает больше контроля и понимания того, что происходит.

### Пошаговая инструкция

#### 1. Откройте SQL редактор в TablePlus

- Нажмите **Cmd+T** (Mac) или **Ctrl+T** (Windows/Linux)
- Или нажмите на вкладку **"SQL"** внизу экрана

#### 2. Сначала сделайте предпросмотр (ШАГ 1)

Скопируйте и выполните этот запрос, заменив `'СТАРЫЙ_ТЕКСТ'`:

```sql
USE bibliotechka;

-- Посмотреть, сколько записей будет затронуто
SELECT 
    COUNT(*) as total_found,
    'Будет найдено записей с этим текстом' as info
FROM `data`
WHERE `title` LIKE '%СТАРЫЙ_ТЕКСТ%';

-- Показать примеры
SELECT 
    slug,
    title as old_title,
    REPLACE(title, 'СТАРЫЙ_ТЕКСТ', 'НОВЫЙ_ТЕКСТ') as new_title
FROM `data`
WHERE `title` LIKE '%СТАРЫЙ_ТЕКСТ%'
LIMIT 10;
```

#### 3. Если всё правильно, выполните замену (ШАГ 2)

```sql
UPDATE `data` 
SET `title` = REPLACE(`title`, 'СТАРЫЙ_ТЕКСТ', 'НОВЫЙ_ТЕКСТ')
WHERE `title` LIKE '%СТАРЫЙ_ТЕКСТ%';
```

**Замените:**
- `'СТАРЫЙ_ТЕКСТ'` - что ищем
- `'НОВЫЙ_ТЕКСТ'` - на что заменяем
- `data` - таблица (может быть `groups`, `subgroups`, `authors`, `versions`)
- `title` - колонка (может быть `description`, `detail`, `comment` и т.д.)

#### 4. Проверьте результат (ШАГ 3)

```sql
-- Проверить, что старый текст больше не встречается
SELECT COUNT(*) as still_remaining
FROM `data`
WHERE `title` LIKE '%СТАРЫЙ_ТЕКСТ%';
```

Должно вернуть `0`.

## 📋 Примеры замен

### Замена в разных колонках

**В поле description:**
```sql
UPDATE `data` 
SET `description` = REPLACE(`description`, 'старый', 'новый')
WHERE `description` LIKE '%старый%';
```

**Во всех текстовых полях одновременно:**
```sql
UPDATE `data` SET
  `title` = REPLACE(`title`, 'старый', 'новый'),
  `description` = REPLACE(`description`, 'старый', 'новый'),
  `detail` = REPLACE(`detail`, 'старый', 'новый')
WHERE `title` LIKE '%старый%' 
   OR `description` LIKE '%старый%' 
   OR `detail` LIKE '%старый%';
```

### Замена с условием (только для определенной группы)

```sql
UPDATE `data` 
SET `title` = REPLACE(`title`, 'старый', 'новый')
WHERE `title` LIKE '%старый%'
  AND `group_slug` = 'designsystem';
```

### Замена URL

```sql
UPDATE `data` 
SET `url_1` = REPLACE(`url_1`, 'https://old-domain.com', 'https://new-domain.com')
WHERE `url_1` LIKE '%old-domain.com%';
```

## 🔒 Безопасность

### Сначала бэкап!

Перед любой массовой заменой сделайте резервную копию:

1. В TablePlus: правая кнопка на базе данных → **"Export"** → выберите формат SQL
2. Или используйте скрипт:
   ```bash
   ./scripts/create-backup.sh
   ```

### Используйте транзакции для отката

Если хотите быть уверены, что сможете откатить изменения:

```sql
START TRANSACTION;

-- Ваш UPDATE запрос
UPDATE `data` SET `title` = REPLACE(`title`, 'старый', 'новый') WHERE ...;

-- Проверьте результат
SELECT * FROM `data` WHERE title LIKE '%новый%' LIMIT 5;

-- Если всё хорошо - подтвердите:
COMMIT;

-- Если что-то не так - откатите:
-- ROLLBACK;
```

## 💡 Преимущества SQL метода

✅ Работает всегда, независимо от версии TablePlus  
✅ Полный контроль над тем, что заменяется  
✅ Можно использовать условия (WHERE)  
✅ Можно заменить сразу в нескольких колонках  
✅ Можно посмотреть результат перед заменой  
✅ Работает быстрее для больших объемов данных  

## 📁 Готовые шаблоны

Откройте файл `database/tableplus_replace_template.sql` - там готовые шаблоны для копирования!

