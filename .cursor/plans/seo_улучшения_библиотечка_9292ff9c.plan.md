---
name: SEO улучшения Библиотечка
overview: "Полноценное SEO: PHP SSR для главной и страниц групп, PHP partials вместо Web Components, серверные Cache-Control заголовки, Schema.org, исправление alt, мета-теги."
todos:
  - id: php-partials
    content: Создать partials/header.php, footer.php, drawer.php, search.php — HTML из Web Components перенести в PHP-файлы
    status: completed
  - id: ssr-index
    content: "Создать index-seo.php: SSR главной с группами и карточками из БД. Обновить .htaccess для маршрута /"
    status: completed
  - id: ssr-group
    content: "Обновить group-seo.php: добавить SSR карточек группы + уникальные title/description/canonical/OG на каждую группу"
    status: completed
  - id: ssr-detail
    content: "Обновить detail-seo.php: заменить file_get_contents(detail.html) на PHP-рендер с partials, добавить Schema.org Article"
    status: completed
  - id: php-file-cache
    content: "Добавить PHP файловый кэш в index-seo.php и group-seo.php: хранить сгенерированный HTML в cache/, TTL 30 минут"
    status: completed
  - id: cache-control-htaccess
    content: Добавить Cache-Control заголовки в .htaccess через mod_headers. Убрать meta Cache-Control из всех HTML/PHP файлов
    status: completed
  - id: fix-body-validity
    content: В index.html и detail.html перенести footer/drawer/search/scripts внутрь </body>
    status: completed
  - id: add-schema-org
    content: Добавить Schema.org (WebSite + Organization + ItemList) в index-seo.php и index.html
    status: completed
  - id: improve-meta
    content: Улучшить description, убрать keywords, добавить hreflang и preconnect для Google Fonts
    status: pending
  - id: fix-alt-images
    content: "Проставить alt: в PHP SSR страницах = title карточки/группы; в JS шаблонах (card-template, group-template) установить alt через JS при рендере"
    status: completed
  - id: improve-sitemap
    content: Добавить lastmod, changefreq и priority в sitemap.xml
    status: completed
isProject: true
---

# SEO улучшения для [bibliotechka.online](http://bibliotechka.online)

## Что уже есть (хорошо)

- `sitemap.xml` с 649+ карточками
- `robots.txt` с указанием на sitemap
- Яндекс верификация, Метрика, OG-теги
- `detail-seo.php` уже делает частичный SSR для страниц карточек
- `group-seo.php` уже маршрутизирует группы
- MySQL DB с PDO через `api/config.php` — готово для SSR

## Архитектура решения

```
Текущий поток:
/          → index.html (JS рендерит карточки → Яндекс видит пустоту)
/card/...  → detail-seo.php → подставляет мета, но base — detail.html (с Web Components)
/resource  → group-seo.php → просто отдаёт group.html (JS рендерит карточки)

Новый поток:
/          → index-seo.php (PHP рендерит ВСЕ группы + карточки из БД → Яндекс видит контент)
/card/...  → detail-seo.php (обновлённый: PHP partials, Schema.org Article, без Web Components)
/resource  → group-seo.php (обновлённый: PHP рендерит карточки группы + мета)
```

## Детали реализации

### 1. PHP partials — вместо Web Components

Создать директорию `partials/` с четырьмя файлами:

- `partials/header.php` — HTML из `js/component/header.js` → `connectedCallback` innerHTML
- `partials/footer.php` — HTML из `js/component/footer.js`
- `partials/drawer.php` — HTML из `js/component/drawer.js` (с инлайн-хедером, убрать `<header-component>`)
- `partials/search.php` — HTML из `js/component/search.js`

PHP SSR страницы используют `<?php include 'partials/header.php'; ?>` вместо `<header-component>`.  
JS-файлы компонентов **остаются** для гидрации на старых страницах (about.html, 404.html), но их `connectedCallback` можно будет упростить — они больше не главный источник HTML.

### 2. Полный SSR — `index-seo.php` (новый файл)

Запросы к БД (уже есть соединение через `api/config.php`):

```php
// Группы
SELECT slug, title_ru, description_ru, cover FROM `groups` ORDER BY sort_order

// Карточки (все опубликованные)
SELECT slug, url_seo_yandex, title, description, cover_short, group_slug FROM data
WHERE status_slug = 'published' ORDER BY slug
```

Рендерит как реальный HTML (не через JS-шаблоны):

```html
<a class="card" href="/card/designvault-017">
  <img class="card-cover" src="..." alt="DesignVault — коллекция лучших лендингов" loading="lazy">
  <p class="lg-medium card-title">DesignVault</p>
  <p class="md-regular card-description">Коллекция лучших лендингов...</p>
</a>
```

JS (`js/index.js`) по-прежнему запускается и **заменяет** статический HTML динамическим (поиск, фильтры, сортировка). Robots Яндекса видят pre-rendered HTML без JS.

Обновить `.htaccess`:

```apache
# Было: / → index.html (статический файл)
# Стало: добавить маршрут для /
RewriteRule ^$ /index-seo.php [L]
```

### 3. Обновить `group-seo.php`

Добавить:

- Запрос группы из БД (title, description, cover)
- Запрос карточек группы: `SELECT ... FROM data WHERE group_slug = ? AND status_slug = 'published'`
- Уникальные `<title>`, `<meta name="description">`, `<link rel="canonical">`, OG-теги для каждой группы
- Рендер карточек как HTML (аналогично index-seo.php)
- PHP partials для header/footer

### 4. Обновить `detail-seo.php`

Сейчас: читает `detail.html` через `file_get_contents` и делает regex-замены.  
После: рендерить полноценный PHP HTML с `<?php include 'partials/header.php'; ?>`.  
Добавить Schema.org `Article`:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "description": "...",
  "image": "...",
  "url": "https://bibliotechka.online/card/..."
}
```

### 5. PHP файловый кэш

Добавить в `index-seo.php` и `group-seo.php`:

```php
$cacheFile = __DIR__ . '/cache/index.html'; // или cache/group-{slug}.html
$cacheTtl  = 1800; // 30 минут

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
    header('Content-Type: text/html; charset=utf-8');
    header('X-Cache: HIT');
    readfile($cacheFile);
    exit;
}

// ... генерируем HTML ...

file_put_contents($cacheFile, $html);
```

Директория `cache/` добавляется в `.gitignore`.  
При сохранении карточки в admin-панели можно сбрасывать кэш через `unlink($cacheFile)`.  
Это даёт ускорение в 10–50x: вместо SQL-запроса на 600+ записей — чтение одного файла.

### 6. Cache-Control в `.htaccess`

Удалить из всех HTML/PHP: `<meta http-equiv="Cache-Control" ...>` и `<meta http-equiv="Pragma" ...>`.  
Добавить в `.htaccess`:

```apache
<IfModule mod_headers.c>
    # HTML и PHP страницы — кэш 1 час
    <FilesMatch "\.(html|php)$">
        Header set Cache-Control "public, max-age=3600, must-revalidate"
    </FilesMatch>
    # Статические ресурсы — кэш 1 год (CSS, JS, шрифты, изображения)
    <FilesMatch "\.(css|js|webp|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
</IfModule>
```

### 6. Alt у изображений

**В PHP SSR страницах** — уже сделано в `detail-seo.php`. Для `index-seo.php` и `group-seo.php`:

```php
<img src="<?= e($card['cover_short']) ?>" alt="<?= e($card['title']) ?>">
```

**В JS шаблонах** (для браузеров с JS) — в `js/index.js` при рендере карточек:

```js
img.alt = card.title; // вместо пустого alt=""
```

Аналогично для group-cover: `img.alt = group.title_ru`.  
В `js/detail.js` уже есть: `mainImage.alt = item.title` — ✅ верно.

### 7. Мета-теги, Schema.org, hreflang

В `index-seo.php` добавить в `<head>`:

- Улучшенный `description`: *"Библиотечка — коллекция 600+ лучших материалов по дизайну, UX/UI, типографике и вдохновению."*
- Убрать `<meta name="keywords">`
- `<link rel="alternate" hreflang="ru" href="https://bibliotechka.online">` + `hreflang="x-default"`
- `<link rel="preconnect" href="https://fonts.googleapis.com">` + `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
- Шрифты через `<link rel="stylesheet">` вместо `@import`
- Schema.org WebSite + Organization + ItemList с количеством карточек

### 8. Sitemap.xml

Добавить `<lastmod>` (сегодняшняя дата), `<changefreq>weekly</changefreq>`, `<priority>` (0.9 для главной, 0.8 для групп, 0.7 для карточек).

## Приоритет

- **Критично:** п.1–4 (SSR — Яндекс видит контент)
- **Важно:** п.5 (PHP кэш — скорость), п.6 (Cache-Control .htaccess), п.7 (alt)
- **Улучшение ранжирования:** п.8 (мета-теги, Schema.org)
- **Желательно:** п.9 (sitemap)

