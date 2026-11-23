# База данных для Библиотечки

База данных настроена и работает на продакшен сервере.

## Быстрый старт

### Продакшен (текущая конфигурация)

База данных находится на сервере хостинга. Настройки подключения в `api/config.php`:

```
Host: mysql.35401aca832c.hosting.myjino.ru
Port: 3306
User: j35045845_biblio
Password: [см. api/config.php]
Database: j35045845_biblio
```

**Важно:** Убедитесь, что доступ к БД открыт для IP вашего веб-сервера в панели управления хостингом.

### Вариант для локальной разработки: Docker

Для локальной разработки можно использовать Docker:

```bash
docker-compose up -d
```

**Подключение (Docker):**
```
Host: localhost
Port: 3306
User: bibliotechka_user
Password: user_password_change_me
Database: bibliotechka
```


## Структура базы данных

База данных содержит **6 таблиц**:

### Основные таблицы

1. **`groups`** - Группы (категории материалов)
   - Соответствует данным из `group.json`
   - Первичный ключ: `slug`
   - Содержит SEO поля, Open Graph метаданные
   - Документация: [`database/tables/groups/README.md`](tables/groups/README.md)

2. **`subgroups`** - Подгруппы (подкатегории материалов)
   - Соответствует данным из `subgroup.json`
   - Первичный ключ: `slug`
   - Документация: [`database/tables/subgroups/README.md`](tables/subgroups/README.md)

3. **`data`** - Элементы/карточки (основной контент)
   - Соответствует данным из `data.json`
   - Первичный ключ: `slug`
   - Внешние ключи: `group_slug`, `subgroup_slug`, `version_slug`
   - Документация: [`database/tables/data/README.md`](tables/data/README.md)

### Вспомогательные таблицы

4. **`versions`** - Версии/релизы проекта
   - Хранит информацию о версиях проекта
   - Первичный ключ: `slug`
   - Документация: [`database/tables/versions/README.md`](tables/versions/README.md)

5. **`authors`** - Авторы материалов
   - Хранит информацию об авторах
   - Первичный ключ: `slug`
   - Документация: [`database/tables/authors/README.md`](tables/authors/README.md)

6. **`card_authors`** - Связь карточек и авторов (many-to-many)
   - Связующая таблица между `data` и `authors`
   - Составной первичный ключ: (`card_slug`, `author_slug`)
   - Позволяет одной карточке иметь несколько авторов
   - Документация: [`database/tables/card_authors/README.md`](tables/card_authors/README.md)

### Схема связей

```
groups (1) ──< (N) data (N) >── (1) subgroups
                          │
                          │ (N)
                          │
                          v
                    card_authors
                          │ (N)
                          │
                          v
                    authors (1)

data (N) >── (1) versions
```

Подробная документация по каждой таблице находится в папке [`database/tables/`](tables/).

## Миграция кода с JSON на MySQL

📖 **[Правила миграции кода](../docs/archive/CODE_MIGRATION_RULES.md)** - подробное руководство по изменению JavaScript кода для работы с MySQL через API вместо JSON файлов.

## Инициализация базы данных

При первом запуске Docker контейнера база данных автоматически инициализируется из файла `database/init.sql`, который создаёт все **6 таблиц** в правильном порядке:

1. `groups` (независимая)
2. `subgroups` (независимая)
3. `versions` (независимая, нужна для `data`)
4. `authors` (независимая, нужна для `card_authors`)
5. `data` (зависит от `groups`, `subgroups`, `versions`)
6. `card_authors` (зависит от `data` и `authors`)

**Важно:** Файл `init.sql` выполняется **только** при первом создании базы данных (когда volume пустой). При перезапуске контейнера данные сохраняются. 

📖 **Дополнительная документация:**
- [`backup_restore.md`](backup_restore.md) - создание бэкапов и восстановление данных
- [docs/](docs/) - прочие гайды: [MASS_TEXT_REPLACE](docs/MASS_TEXT_REPLACE.md), [TABLEPLUS_REPLACE_GUIDE](docs/TABLEPLUS_REPLACE_GUIDE.md), [FILTER_SOLUTIONS](docs/FILTER_SOLUTIONS.md), [SUBGROUPS_ANALYSIS](docs/SUBGROUPS_ANALYSIS.md), [SUBGROUPS_STATISTICS](docs/SUBGROUPS_STATISTICS.md)

## Миграции

Миграции находятся в папке [`migrations/`](migrations/). Подробные описания и чек-листы — в подпапке [migrations/docs/](migrations/docs/). Это исторические изменения схемы базы данных. Для применения миграции:

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

### Решение проблем с подключением

При проблемах с подключением проверьте доступ к MySQL для IP веб-сервера в панели хостинга и корректность данных в `api/config.php`.

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

