# PHP API для Библиотечки

Простой PHP API сервер для работы с MySQL базой данных.

## Эндпоинты

### Группы
- `GET /api/v1/groups/list` - легковесный список групп (для главной страницы)
- `GET /api/v1/groups?slug=designsystem` - полная группа (для страницы группы)

### Подгруппы
- `GET /api/v1/subgroups` - все подгруппы

### Данные (карточки)
- `GET /api/v1/data/list` - легковесный список карточек
- `GET /api/v1/data/list?status_slug=published` - только опубликованные
- `GET /api/v1/data/list?group_slug=designsystem` - карточки группы
- `GET /api/v1/data?slug=001` - полная карточка
- `GET /api/v1/data/001/authors` - авторы карточки

## Быстрый старт

### 1. Настройка подключения к БД

Настройте подключение к базе данных в `api/config.php`:

```php
define('DB_HOST', 'mysql.35401aca832c.hosting.myjino.ru');
define('DB_PORT', '3306');
define('DB_USER', 'j35045845_biblio');
define('DB_PASSWORD', 'tuhrih-zoqmYp');
define('DB_NAME', 'j35045845_biblio');
```

### 2. Тестирование API

Проверьте работу эндпоинтов:

```bash
# Легковесный список групп
curl https://your-domain.com/api/v1/groups/list

# Полная группа
curl https://your-domain.com/api/v1/groups?slug=designsystem

# Подгруппы
curl https://your-domain.com/api/v1/subgroups

# Легковесный список карточек
curl https://your-domain.com/api/v1/data/list?status_slug=published

# Полная карточка
curl https://your-domain.com/api/v1/data?slug=001

# Авторы карточки
curl https://your-domain.com/api/v1/data/001/authors
```

### 3. Использование на хостинге

1. Загрузите папку `api/` на сервер
2. Убедитесь, что Apache поддерживает `.htaccess` и `mod_rewrite`
3. Настройки подключения к БД уже настроены в `api/config.php`
4. API будет доступен на: `https://ваш-домен.com/api/v1/`

## Структура файлов

```
api/
├── index.php      # Главный файл API с роутингом
├── config.php     # Конфигурация подключения к БД
├── router.php     # Роутер для обработки запросов
├── .htaccess      # Настройки Apache для роутинга
├── v1/            # Версия API v1
│   ├── groups.php
│   ├── subgroups.php
│   ├── data.php
│   └── authors.php
└── README.md      # Документация API
```

## Конфигурация

Настройки подключения к БД находятся в `api/config.php`.
Используется единая база данных на сервере.

## Решение проблем

### Ошибка подключения к БД

1. Проверьте настройки подключения в `api/config.php`
2. Убедитесь, что MySQL сервер доступен с вашего хостинга
3. Проверьте правильность учетных данных БД

### API возвращает 404

1. Убедитесь, что `mod_rewrite` включен в Apache
2. Проверьте, что `.htaccess` файл существует и правильно настроен
3. Проверьте логи веб-сервера на хостинге

### CORS ошибки

Если API на другом домене, добавьте в `.htaccess`:
```apache
Header set Access-Control-Allow-Origin "*"
```

## Дополнительная информация

- Подробная документация по базе данных: [`../database/README.md`](../database/README.md)
- Инструкции по бекапу: [`../database/backup_restore.md`](../database/backup_restore.md)
