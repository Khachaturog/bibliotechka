---
name: Фильтрация по published везде
overview: Добавить фильтрацию по status_slug=published во всех местах вывода карточек и в API, чтобы неопубликованные/устаревшие материалы не отображались.
todos: []
isProject: false
---

# Фильтрация по published везде

Цель: скрывать неактуальные материалы — карточки со статусом не `published` не должны отображаться на сайте.

## Текущее состояние


| Место                                                               | Фильтр published                       |
| ------------------------------------------------------------------- | -------------------------------------- |
| Главная (index.js)                                                  | ✅ Есть                                 |
| Drawer (drawer.js)                                                  | ✅ Есть                                 |
| Детали — блок «Другие карточки» (detail.js)                         | ✅ Есть                                 |
| **Страницы групп** (group.js)                                       | ✅ Добавлено                            |
| **API отдельной карточки** (data?slug=..., data?url_seo_yandex=...) | ✅ Добавлено — 404 для неопубликованных |
| Sitemap                                                             | ✅ Есть                                 |


---

## Задачи

### 1. Страницы групп — добавить status_slug в запрос data/list

**Файл:** [js/group.js](js/group.js), строка 38

Сейчас: запрашивает только `group_slug`. На страницах групп показываются все карточки (включая неопубликованные).

**Было:**

```javascript
fetch(window.CONFIG?.getApiUrl('data/list', { group_slug: groupSlug }) || `${API_BASE}/data/list?group_slug=${groupSlug}`)
```

**Станет:**

```javascript
fetch(window.CONFIG?.getApiUrl('data/list', { group_slug: groupSlug, status_slug: 'published' }) || `${API_BASE}/data/list?group_slug=${groupSlug}&status_slug=published`)
```

API `data/list` уже поддерживает оба параметра — они применяются через `AND` в SQL.

---

### 2. API отдельной карточки — возвращать 404 для неопубликованных

**Файл:** [api/index.php](api/index.php) (если используется) или [api/v1/data/index.php](api/v1/data/index.php)

Сейчас: `GET /api/v1/data?slug=...` и `GET /api/v1/data?url_seo_yandex=...` возвращают любую карточку. По прямой ссылке можно открыть неопубликованную.

**Изменение:** добавить условие `AND status_slug = 'published'` в оба SQL-запроса. Если карточка не найдена или статус не published — возвращать 404.

**api/v1/data/index.php** — slug:

```php
$query = "SELECT * FROM data WHERE slug = ? AND status_slug = 'published' LIMIT 1";
```

**api/v1/data/index.php** — url_seo_yandex:

```php
$query = "SELECT * FROM data WHERE url_seo_yandex = ? AND status_slug = 'published' LIMIT 1";
```

**api/index.php** — если там дублируется логика, применить те же изменения в блоках `isset($queryParams['slug'])` и `isset($queryParams['url_seo_yandex'])`.

---

### 3. (Опционально) Дефолт status_slug=published в API data/list

Сейчас API `data/list` без параметра `status_slug` возвращает все карточки. Можно добавить дефолт — если `status_slug` не передан, подставлять `published`.

**Файлы:** [api/v1/data/list.php](api/v1/data/list.php), [api/index.php](api/index.php) (если там есть data/list)

**Риск:** если где-то вызывают data/list без параметров и ожидают все карточки (например, админка) — поведение изменится. Лучше оставить явную передачу `status_slug` со стороны клиента и не менять дефолт в API.

**Рекомендация:** не менять дефолт, оставить явную передачу в каждом клиенте.

---

## Проверка после внедрения

1. Главная — только published ✓ (уже есть)
2. Страница группы — только published ✓ (после правки group.js)
3. Drawer — только published ✓ (уже есть)
4. Детали «Другие карточки» — только published ✓ (уже есть)
5. Прямая ссылка на неопубликованную карточку — 404 ✓ (после правки API)
6. Sitemap — только published ✓ (уже есть)

---

## Будущие статусы

Сейчас используется только `published`. В будущем можно завести другие статусы, например:

- `draft` — черновик
- `archived` — устаревший материал
- `hidden` — скрыто

Фильтрация по `status_slug = 'published'` обеспечит, что на сайте видны только опубликованные материалы независимо от остальных статусов.