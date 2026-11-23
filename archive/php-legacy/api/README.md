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
2. Убедитесь, что Apache поддерживает `.htaccess`, `mod_rewrite` и `mod_headers`
3. Проверьте, что корневой `.htaccess` содержит правила для роутинга API
4. Настройки подключения к БД уже настроены в `api/config.php`
5. API будет доступен на: `https://ваш-домен.com/api/v1/`

**Примечание:** Убедитесь, что в папке `api/` нет собственного `.htaccess` файла, так как это может конфликтовать с корневым `.htaccess`.

## Структура файлов

```
api/
├── config.php              # Конфигурация подключения к БД и вспомогательные функции
├── index.php               # Fallback роутер (для совместимости)
└── v1/                     # Версия API v1
    ├── groups/
    │   ├── list.php        # GET /api/v1/groups/list
    │   └── index.php       # GET /api/v1/groups?slug=...
    ├── data/
    │   ├── list.php        # GET /api/v1/data/list
    │   ├── index.php       # GET /api/v1/data?slug=...
    │   └── authors.php     # GET /api/v1/data/{slug}/authors
    └── subgroups/
        └── index.php       # GET /api/v1/subgroups
```

**Важно:** Роутинг выполняется через `.htaccess` в корне проекта, который напрямую направляет запросы к соответствующим PHP файлам.

## Конфигурация

Настройки подключения к БД находятся в `api/config.php`.
Используется единая база данных на сервере.

## Решение проблем

### Ошибка подключения к БД

1. Проверьте настройки подключения в `api/config.php`
2. Убедитесь, что MySQL сервер доступен с вашего хостинга
3. Проверьте правильность учетных данных БД
4. Убедитесь, что доступ к БД открыт для IP вашего веб-сервера (в панели управления хостингом)

### API возвращает 404

1. Убедитесь, что `mod_rewrite` включен в Apache
2. Проверьте, что корневой `.htaccess` файл существует и правильно настроен
3. Убедитесь, что в папке `api/` нет собственного `.htaccess` (может конфликтовать)
4. Проверьте, что файлы находятся в правильных папках (`api/v1/groups/list.php`, а не `api/groups/list.php`)
5. Проверьте логи веб-сервера на хостинге

### Mixed Content ошибки (HTTP/HTTPS)

Если страница загружается по HTTPS, но API запросы идут по HTTP:

1. Убедитесь, что `getApiUrl()` в `js/config.js` возвращает относительные пути (без `http://`)
2. Добавьте в HTML файлы мета-тег:
   ```html
   <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
   ```

### CORS ошибки

CORS заголовки уже настроены в корневом `.htaccess`:
```apache
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type"
```

Если ошибки продолжаются, убедитесь, что `mod_headers` включен в Apache.

## Дополнительная информация

- Подробная документация по базе данных: [`../database/README.md`](../database/README.md)
- Инструкции по бекапу: [`../database/backup_restore.md`](../database/backup_restore.md)
