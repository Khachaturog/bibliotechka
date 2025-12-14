# Перенос базы данных на сервер

> **Примечание:** Миграция базы данных на сервер уже выполнена. База данных находится на сервере `mysql.35401aca832c.hosting.myjino.ru`. Этот документ сохранен для справки и возможных будущих миграций.

## 📋 Подготовка

Перед переносом убедитесь, что:
1. ✅ База данных на сервере создана
2. ✅ У вас есть доступ к MySQL на сервере (SSH или прямой доступ)
3. ✅ У вас есть учетные данные для подключения к БД на сервере

## 🚀 Способ 1: Прямой перенос через SSH (рекомендуется)

### Шаг 1: Создайте бэкап локально

```bash
# Создать бэкап (если есть локальная БД)
mysqldump \
  -h localhost \
  -u your_local_user \
  -p \
  --no-tablespaces \
  --default-character-set=utf8mb4 \
  your_local_database > backup_for_server.sql

# Или создать бэкап с сервера для переноса на другой сервер
mysqldump \
  -h mysql.35401aca832c.hosting.myjino.ru \
  -P 3306 \
  -u j35045845_biblio \
  -ptuhrih-zoqmYp \
  --no-tablespaces \
  --default-character-set=utf8mb4 \
  j35045845_biblio > backup_for_server.sql
```

### Шаг 2: Загрузите на сервер и импортируйте

```bash
# Загрузить файл на сервер через SCP
scp backup_for_server.sql user@your-server.com:/tmp/

# Подключиться к серверу
ssh user@your-server.com

# Импортировать базу данных
mysql -u your_db_user -p your_database_name < /tmp/backup_for_server.sql
```

### Шаг 3: Или одной командой (без сохранения файла)

```bash
# Прямой перенос через SSH туннель
mysqldump \
  -h source_host \
  -u source_user \
  -p \
  --no-tablespaces \
  --default-character-set=utf8mb4 \
  source_database | \
  ssh user@your-server.com \
  "mysql -u your_db_user -p your_database_name"
```

## 🔧 Способ 2: Через прямой доступ к MySQL на сервере

Если MySQL на сервере доступен напрямую (не через SSH):

```bash
# Экспорт и импорт одной командой
mysqldump \
  -h source_host \
  -u source_user \
  -p \
  --no-tablespaces \
  --default-character-set=utf8mb4 \
  source_database | \
  mysql -h your-server-ip \
  -u your_db_user \
  -p \
  your_database_name
```

## 📤 Способ 3: Через FTP и phpMyAdmin

### Шаг 1: Создайте бэкап

```bash
mysqldump \
  -h source_host \
  -u source_user \
  -p \
  --no-tablespaces \
  --default-character-set=utf8mb4 \
  source_database > backup_for_server.sql
```

### Шаг 2: Загрузите через FTP

```bash
# Используйте FTP клиент или команду
ftp your-server.com
# Загрузите файл backup_for_server.sql
```

### Шаг 3: Импортируйте через phpMyAdmin

1. Откройте phpMyAdmin на сервере
2. Выберите вашу базу данных
3. Перейдите на вкладку "Импорт"
4. Выберите файл `backup_for_server.sql`
5. Нажмите "Вперёд"

## 🔐 Способ 4: Использование скрипта (автоматизация)

Создайте файл `scripts/migrate-db-to-server.sh`:

```bash
#!/bin/bash

# Настройки исходной БД (локальной или другого сервера)
SOURCE_DB_HOST="localhost"
SOURCE_DB_USER="your_source_user"
SOURCE_DB_PASS="your_source_password"
SOURCE_DB_NAME="your_source_database"

# Настройки сервера (измените на свои)
SERVER_HOST="your-server.com"
SERVER_USER="your_ssh_user"
SERVER_DB_USER="your_db_user"
SERVER_DB_NAME="bibliotechka"
SERVER_DB_PASS=""  # Будет запрошен при выполнении

# Создаем временный файл бэкапа
BACKUP_FILE="/tmp/backup_$(date +%Y%m%d_%H%M%S).sql"

echo "📦 Создание бэкапа..."
mysqldump \
  -h "$SOURCE_DB_HOST" \
  -u "$SOURCE_DB_USER" \
  -p"$SOURCE_DB_PASS" \
  --no-tablespaces \
  --default-character-set=utf8mb4 \
  "$SOURCE_DB_NAME" > "$BACKUP_FILE"

echo "📤 Загрузка на сервер..."
scp "$BACKUP_FILE" "$SERVER_USER@$SERVER_HOST:/tmp/"

echo "📥 Импорт на сервере..."
ssh "$SERVER_USER@$SERVER_HOST" \
  "mysql -u $SERVER_DB_USER -p$SERVER_DB_PASS $SERVER_DB_NAME < /tmp/$(basename $BACKUP_FILE) && rm /tmp/$(basename $BACKUP_FILE)"

# Удаляем локальный файл
rm "$BACKUP_FILE"

echo "✅ Перенос завершен!"
```

Использование:
```bash
chmod +x scripts/migrate-db-to-server.sh
# Отредактируйте настройки в скрипте
./scripts/migrate-db-to-server.sh
```

## ⚙️ Важные настройки после переноса

### 1. Обновите конфигурацию на сервере

В файле `api/config.php` на сервере укажите правильные данные:

```php
define('DB_HOST', 'localhost');  // или IP сервера БД
define('DB_USER', 'your_db_user');
define('DB_PASSWORD', 'your_db_password');
define('DB_NAME', 'bibliotechka');
```

### 2. Проверьте кодировку

Убедитесь, что на сервере используется UTF-8:

```sql
-- Проверить кодировку базы
SHOW VARIABLES LIKE 'character_set%';

-- Если нужно, установить UTF-8
ALTER DATABASE bibliotechka CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Проверьте данные

```bash
# На сервере
mysql -u your_db_user -p bibliotechka -e "
  SELECT 
    'groups' as table_name, COUNT(*) as count FROM \`groups\`
  UNION ALL
  SELECT 'subgroups', COUNT(*) FROM subgroups
  UNION ALL
  SELECT 'data', COUNT(*) FROM data
  UNION ALL
  SELECT 'authors', COUNT(*) FROM authors
  UNION ALL
  SELECT 'card_authors', COUNT(*) FROM card_authors
  UNION ALL
  SELECT 'versions', COUNT(*) FROM versions;
"
```

## 🔄 Обновление данных (синхронизация)

Если нужно обновить данные на сервере (не полный перенос):

```bash
# Создать бэкап только данных (без структуры)
mysqldump \
  -h source_host \
  -u source_user \
  -p \
  --no-create-info \
  --skip-triggers \
  --default-character-set=utf8mb4 \
  source_database > backup_data_only.sql

# Импортировать на сервер
mysql -h your-server-ip -u your_db_user -p your_database_name < backup_data_only.sql
```

## ⚠️ Важные замечания

1. **Размер файла**: Если база большая, используйте сжатие:
   ```bash
   mysqldump ... | gzip > backup.sql.gz
   scp backup.sql.gz user@server:/tmp/
   ssh user@server "gunzip < /tmp/backup.sql.gz | mysql ..."
   ```

2. **Внешние ключи**: При импорте могут быть проблемы с внешними ключами. Решение:
   ```sql
   SET FOREIGN_KEY_CHECKS = 0;
   -- импорт данных
   SET FOREIGN_KEY_CHECKS = 1;
   ```

3. **Права доступа**: Убедитесь, что пользователь БД на сервере имеет права на создание таблиц и импорт данных.

4. **Бэкап сервера**: Перед импортом сделайте бэкап существующей базы на сервере!

## 🆘 Решение проблем

### Ошибка: "Access denied"
- Проверьте правильность логина и пароля
- Убедитесь, что пользователь имеет права на импорт

### Ошибка: "Table doesn't exist"
- Сначала создайте структуру базы (выполните `database/init.sql` на сервере)
- Или используйте полный бэкап (со структурой)

### Ошибка: "Out of memory"
- Увеличьте `max_allowed_packet` в MySQL:
  ```sql
  SET GLOBAL max_allowed_packet=1073741824;  -- 1GB
  ```

### Проблемы с кодировкой
- Убедитесь, что используется `utf8mb4`
- Проверьте настройки MySQL на сервере

