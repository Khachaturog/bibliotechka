# Бекап и восстановление базы данных

## ⚠️ Важно: Защита данных

Файл `init.sql` выполняется **ТОЛЬКО** при первом создании базы данных (когда volume пустой). 
При обычном перезапуске контейнера (`docker-compose restart`) данные **сохраняются**.

## Когда данные могут быть потеряны

1. **Удаление volume:**
   ```bash
   docker volume rm bibliotechka-5_mysql_data
   ```

2. **Полное пересоздание с удалением volume:**
   ```bash
   docker-compose down -v  # -v удаляет volumes
   ```

3. **Пересоздание контейнера с новым volume**

## Создание бекапа

### Быстрый бекап

```bash
# Создать бекап всей базы
docker exec bibliotechka-mysql mysqldump \
  -u bibliotechka_user \
  -puser_password_change_me \
  --no-tablespaces \
  bibliotechka > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Бекап только данных (без структуры)

```bash
docker exec bibliotechka-mysql mysqldump \
  -u bibliotechka_user \
  -puser_password_change_me \
  --no-create-info \
  --skip-triggers \
  bibliotechka > backup_data_$(date +%Y%m%d_%H%M%S).sql
```

### Бекап конкретных таблиц

```bash
docker exec bibliotechka-mysql mysqldump \
  -u bibliotechka_user \
  -puser_password_change_me \
  bibliotechka groups subgroups data authors card_authors versions \
  > backup_tables_$(date +%Y%m%d_%H%M%S).sql
```

## Восстановление из бекапа

```bash
# Восстановить из бекапа
docker exec -i bibliotechka-mysql mysql \
  -u bibliotechka_user \
  -puser_password_change_me \
  bibliotechka < backup_20231213_120000.sql
```

## Автоматический бекап (рекомендуется)

Создайте скрипт `scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

docker exec bibliotechka-mysql mysqldump \
  -u bibliotechka_user \
  -puser_password_change_me \
  --no-tablespaces \
  bibliotechka > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

# Удалить бекапы старше 7 дней
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete

echo "Бекап создан: $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
```

## Восстановление из JSON файлов

Если данные потеряны, но есть JSON файлы:
- `data/data.json` - карточки
- `data/group.json` - группы  
- `data/subgroup.json` - подгруппы

Нужно создать скрипт импорта (см. `RESTORE_DATA.md`).

## Проверка данных

```bash
# Проверить количество записей в таблицах
docker exec bibliotechka-mysql mysql \
  -u bibliotechka_user \
  -puser_password_change_me \
  bibliotechka -e "
    SELECT 
      'groups' as table_name, COUNT(*) as count FROM \`groups\`
    UNION ALL
    SELECT 'subgroups', COUNT(*) FROM subgroups
    UNION ALL
    SELECT 'data', COUNT(*) FROM data
    UNION ALL
    SELECT 'authors', COUNT(*) FROM authors
    UNION ALL
    SELECT 'card_authors', COUNT(*) FROM card_authors;
  "
```

## Перенос базы данных на сервер

📖 **Подробная инструкция:** [`migrate_to_server.md`](migrate_to_server.md)

### Быстрый способ (через SSH)

```bash
# 1. Создать бэкап
docker exec bibliotechka-mysql mysqldump \
  -u bibliotechka_user \
  -puser_password_change_me \
  --no-tablespaces \
  --default-character-set=utf8mb4 \
  bibliotechka > backup_for_server.sql

# 2. Загрузить на сервер и импортировать
scp backup_for_server.sql user@your-server.com:/tmp/
ssh user@your-server.com "mysql -u db_user -p db_name < /tmp/backup_for_server.sql"
```

### Автоматический скрипт

Используйте готовый скрипт `scripts/migrate-db-to-server.sh`:
1. Отредактируйте настройки сервера в скрипте
2. Запустите: `./scripts/migrate-db-to-server.sh`

## Рекомендации

1. ✅ **Делайте бекапы регулярно** (например, раз в день)
2. ✅ **Перед важными операциями** (миграции, обновления) делайте бекап
3. ✅ **Храните бекапы** в отдельной папке (не в Git)
4. ✅ **Тестируйте восстановление** из бекапа периодически
5. ⚠️ **Не используйте `docker-compose down -v`** без необходимости
6. ✅ **Перед переносом на сервер** сделайте бэкап существующей базы на сервере

