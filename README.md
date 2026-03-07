# Библиотечка

Коллекция материалов для дизайнеров: ресурсы, дизайн-системы, насмотренность, книги и многое другое.

Сайт: **https://bibliotechka.online**

## Требования

- PHP 8.0+ (рекомендуется 8.4+)
- MySQL 8.0+ (удалённая БД)
- Apache с `mod_rewrite` и `mod_headers`
- Node.js 14+ (только для dev-скриптов)

## Быстрый старт (локально)

```bash
npm install           # один раз
./start-api.sh        # macOS/Linux
.\start-api.ps1       # Windows (PowerShell)
```

Сервер: **http://localhost:8000**

Подробнее: [docs/guides/LOCAL_DEV.md](docs/guides/LOCAL_DEV.md)

## Архитектура

- **Рендеринг**: полный SSR на PHP — поисковики видят весь контент без JS
- **Шаблоны**: PHP-файлы страниц с подключением partials (`partials/*.php`)
- **JavaScript**: клиентский JS подгружает контент после загрузки страницы
- **Кэш**: HTML страниц и sitemap кэшируются в `cache/` на 24 часа (TTL сбрасывается удалением файла)
- **Деплой**: обычный хостинг Apache + PHP

### Страницы

| URL | Файл | Описание |
|-----|------|----------|
| `/` | `index.php` | Главная: группы + карточки (SSR + кэш) |
| `/{slug}` | `group.php` | Страница группы (SSR + кэш) |
| `/card/{url_seo}` | `detail.php` | Страница карточки |
| `/about` | `about.php` | О проекте |
| `/sitemap.xml` | `sitemap.php` | Динамический sitemap (кэш 24ч) |
| `/*` | `404.php` | Страница ошибки 404 |

### Partials (переиспользуемые компоненты)

```
partials/
├── header.php   # Хедер с навигацией
├── footer.php   # Футер
├── drawer.php   # Мобильное меню
└── search.php   # Оверлей поиска
```

Все страницы подключают одни и те же partials — правка хедера в `partials/header.php` обновляет весь сайт.

## Структура проекта

```
bibliotechka-4/
├── index.php              # Главная страница (SSR)
├── group.php              # Страница группы (SSR)
├── detail.php             # Страница карточки (SSR)
├── about.php              # О проекте
├── sitemap.php            # Динамический sitemap.xml
├── 404.php                # Страница ошибки
├── router.php             # Роутер для PHP встроенного сервера (локальная разработка)
├── .htaccess              # Apache: URL rewriting, Cache-Control, CORS
├── partials/              # Переиспользуемые PHP-фрагменты (header, footer, drawer, search)
├── api/                   # PHP API
│   ├── config.php         # Конфигурация БД, SITE_BASE_URL, absoluteUrl()
│   └── v1/                # Эндпоинты
│       ├── groups/        # GET /api/v1/groups/list, /api/v1/groups?slug=
│       ├── data/          # GET /api/v1/data/list, /api/v1/data?slug=, /api/v1/data/{slug}/authors
│       └── subgroups/     # GET /api/v1/subgroups
├── js/                    # Клиентский JavaScript
│   ├── config.js          # Конфигурация API и URL
│   ├── index.js           # Главная страница
│   ├── group.js           # Страница группы
│   ├── detail.js          # Страница карточки
│   ├── about.js           # О проекте (история версий)
│   └── drawer.js          # Тема, дравер, поиск (toggleTheme/Drawer/Search)
├── css/                   # Стили
├── images/                # Статические изображения (favicon, превью групп)
├── cache/                 # Файловый кэш HTML/XML (генерируется автоматически)
├── database/              # SQL-схема и миграции
├── docs/                  # Документация
└── scripts/               # Dev-скрипты (миграции, IndexNow и др.)
```

## API эндпоинты

### Группы
- `GET /api/v1/groups/list` — список групп (для главной)
- `GET /api/v1/groups?slug={slug}` — группа по slug

### Подгруппы
- `GET /api/v1/subgroups` — все подгруппы
- `GET /api/v1/subgroups?group_slug={slug}` — подгруппы группы

### Карточки
- `GET /api/v1/data/list` — все карточки
- `GET /api/v1/data/list?status_slug=published` — только опубликованные
- `GET /api/v1/data/list?group_slug={slug}` — карточки группы
- `GET /api/v1/data?slug={slug}` — карточка по slug
- `GET /api/v1/data/{slug}/authors` — авторы карточки

Все эндпоинты возвращают JSON. Подробнее: [api/README.md](api/README.md)

## SEO

- Полный SSR: Яндекс видит весь контент без выполнения JS
- `<title>`, `<meta description>`, canonical, og:*, twitter:*, hreflang — на каждой странице
- Schema.org (WebSite, Organization, CollectionPage, Article) — в `<head>`
- SSR-контент скрывается от пользователей через `html.js #ssr-content { display: none }`, но виден поисковым роботам
- Динамический `sitemap.xml` с `lastmod` и `priority` — только опубликованные карточки
- `robots.txt` разрешает индексацию всего сайта

## Кэш

PHP-страницы кэшируют HTML в папку `cache/`:

| Файл | TTL |
|------|-----|
| `cache/index.html` | 24 часа |
| `cache/group-{slug}.html` | 24 часа |
| `cache/sitemap.xml` | 24 часа |

**Сброс кэша**: удалить нужный файл из `cache/` на сервере — при следующем запросе он пересоберётся.

## Деплой

1. Загрузите все файлы на сервер (кроме `node_modules/`, `cache/`, `backups/`, `extracted_data/`)
2. Убедитесь, что `.htaccess` в корне и Apache поддерживает `mod_rewrite`, `mod_headers`
3. Права доступа: файлы `644`, папки `755`
4. Папка `cache/` должна быть доступна для записи (`chmod 755 cache/`)
5. Настройте доступ к MySQL для IP веб-сервера (в `api/config.php`)
6. После деплоя удалите файлы кэша, если они есть

## Обложки

Скейлить в 0.4× (short) и 2× (large).

Figma: https://www.figma.com/design/yiTWBpvvNWonpRqNzobDGW/

## Документация

- [Локальная разработка](docs/guides/LOCAL_DEV.md)
- [Диагностика проблем](docs/guides/DIAGNOSTICS.md)
- [IndexNow](docs/guides/INDEXNOW.md)
- [База данных](database/README.md)
- [API](api/README.md)
- [История изменений](сhangelog.md)
