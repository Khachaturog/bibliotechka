# База данных для Библиотечки

База данных уже настроена и работает.

## Быстрый старт

### Вариант 1: Docker (рекомендуется для разработки)

```bash
docker-compose up -d
```

**Подключение:**
```
Host: localhost
Port: 3306
User: bibliotechka_user
Password: user_password_change_me
Database: bibliotechka
```


## Структура базы данных

- **groups** - Группы (из group.json)
- **subgroups** - Подгруппы (из subgroup.json)
- **data** - Элементы (из data.json, ранее называлась `items`)
- **versions** - Версии/релизы проекта
- **authors** - Авторы материалов
- **card_authors** - Связь карточек и авторов (many-to-many)

## Инициализация базы данных

При первом запуске Docker контейнера база данных автоматически инициализируется из файла `database/init.sql`, который создаёт все необходимые таблицы.

## Миграции

Миграции находятся в папке `database/migrations/`. Это исторические изменения схемы базы данных. Для применения миграции:

```bash
# Через Docker
docker exec -i bibliotechka-mysql mysql -u bibliotechka_user -puser_password_change_me bibliotechka < database/migrations/005_remove_id_from_data.sql

# Или через IDE (Database Client)
# Просто выполните SQL из файла миграции
```

### Импорт данных

При импорте больших объёмов данных может возникнуть ошибка внешних ключей. Решение:

1. **Перед импортом** отключите проверку внешних ключей:
```sql
SET FOREIGN_KEY_CHECKS = 0;
```

2. **Импортируйте данные** через ваш инструмент (phpMyAdmin, Database Client и т.д.)

3. **После импорта** включите проверку обратно:
```sql
SET FOREIGN_KEY_CHECKS = 1;
```

## Подключение через IDE

### VS Code / Cursor

1. Установите расширение "Database Client"
2. `Ctrl+Shift+P` → "Database: Add Connection" → MySQL
3. Заполните данные подключения

### Данные подключения (Docker)

```
Host: localhost
Port: 3306
User: bibliotechka_user
Password: user_password_change_me
Database: bibliotechka
```

## Полезные команды Docker

```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Просмотр логов
docker-compose logs mysql

# Подключение через CLI
docker exec -it bibliotechka-mysql mysql -u bibliotechka_user -p bibliotechka
```

