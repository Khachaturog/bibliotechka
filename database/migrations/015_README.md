# Миграция 015: Изменение каскадного удаления групп и подгрупп на SET NULL

## Описание

Эта миграция изменяет поведение базы данных при удалении группы (group) или подгруппы (subgroup). Вместо автоматического удаления связанных записей (`ON DELETE CASCADE`), соответствующие поля будут устанавливаться в `NULL`:

- При удалении группы: `subgroups.group_slug` и `data.group_slug` → `NULL` (подгруппы и карточки сохраняются)
- При удалении подгруппы: `data.subgroup_slug` → `NULL` (карточки сохраняются)

## Изменения

### Таблица `data`:

1. **Колонка `group_slug`**:
   - Было: `NOT NULL`
   - Стало: `NULL` (разрешены NULL значения)

2. **Колонка `subgroup_slug`**:
   - Было: `NOT NULL`
   - Стало: `NULL` (разрешены NULL значения)

3. **Внешний ключ `data_ibfk_1`** (group_slug → groups.slug):
   - Было: `ON DELETE CASCADE` (удаление группы → удаление всех карточек)
   - Стало: `ON DELETE SET NULL` (удаление группы → `group_slug = NULL` у всех карточек)

4. **Внешний ключ `data_ibfk_2`** (subgroup_slug → subgroups.slug):
   - Было: `ON DELETE CASCADE` (удаление подгруппы → удаление всех карточек)
   - Стало: `ON DELETE SET NULL` (удаление подгруппы → `subgroup_slug = NULL` у всех карточек)

### Таблица `subgroups`:

5. **Колонка `group_slug`**:
   - Было: `NOT NULL`
   - Стало: `NULL` (разрешены NULL значения)

6. **Внешний ключ `fk_subgroups_group`** (group_slug → groups.slug):
   - Было: `ON DELETE CASCADE` (удаление группы → удаление всех подгрупп)
   - Стало: `ON DELETE SET NULL` (удаление группы → `group_slug = NULL` у всех подгрупп)

## Зачем это нужно?

- **Сохранение данных**: Подгруппы и карточки не удаляются при удалении группы
- **Сохранение данных**: Карточки не удаляются при удалении подгруппы
- **Гибкость**: Можно позже переназначить подгруппы и карточки на другие группы/подгруппы
- **Безопасность**: Снижается риск случайной потери данных

## Выполнение миграции

```bash
# Локально (если используется Docker)
docker exec -i bibliotechka-mysql mysql -uroot -proot bibliotechka < database/migrations/015_change_subgroup_cascade_to_set_null.sql

# На сервере (замените параметры подключения)
mysql -h HOST -u USER -p DATABASE < database/migrations/015_change_subgroup_cascade_to_set_null.sql
```

## Откат

Если нужно вернуть каскадное удаление:

```sql
SET FOREIGN_KEY_CHECKS = 0;

-- Удаляем внешние ключи
ALTER TABLE `data` DROP FOREIGN KEY `data_ibfk_1`;
ALTER TABLE `data` DROP FOREIGN KEY `data_ibfk_2`;
ALTER TABLE `subgroups` DROP FOREIGN KEY `fk_subgroups_group`;

-- Возвращаем NOT NULL (только если все записи имеют соответствующие значения)
ALTER TABLE `data`
  MODIFY COLUMN `group_slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN `subgroup_slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `subgroups`
  MODIFY COLUMN `group_slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL;

-- Возвращаем CASCADE
ALTER TABLE `data`
  ADD CONSTRAINT `data_ibfk_1` 
  FOREIGN KEY (`group_slug`) 
  REFERENCES `groups` (`slug`) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE,
  ADD CONSTRAINT `data_ibfk_2` 
  FOREIGN KEY (`subgroup_slug`) 
  REFERENCES `subgroups` (`slug`) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

ALTER TABLE `subgroups`
  ADD CONSTRAINT `fk_subgroups_group` 
  FOREIGN KEY (`group_slug`) 
  REFERENCES `groups` (`slug`) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
```

## Дата

2025-12-19

