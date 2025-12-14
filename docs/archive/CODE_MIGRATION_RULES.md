# Правила миграции кода: JSON → MySQL API

Документ описывает правила изменения кода для перехода с загрузки данных из JSON файлов на получение данных из MySQL через API.

## Общая концепция

**Было:** Данные загружаются напрямую из JSON файлов через `fetch('data/*.json')`  
**Станет:** Данные загружаются через API эндпоинты, которые обращаются к MySQL

## Структура API эндпоинтов

Для работы с MySQL необходимо создать API сервер (например, на Node.js/Express, PHP, Python и т.д.) со следующими эндпоинтами:

### Базовый URL
```
/api/v1/
```

### Эндпоинты

#### 1. Группы (Groups)

##### 1.1. Легковесный запрос для списков (для главной страницы)
```
GET /api/v1/groups/list
```
Возвращает только основные поля групп для отображения на главной странице.

**Ответ (только нужные поля):**
```json
[
  {
    "slug": "designsystem",
    "title_ru": "Дизайн-система",
    "cover": "images/groups/designsystem.webp",
    "description_ru": "Компоненты, гайдлайны, брендбуки",
    "sort": 3
  }
]
```

**SQL запрос для легковесного списка групп:**
```sql
SELECT 
    slug,
    title_ru,
    cover,
    description_ru,
    sort
FROM `groups`
ORDER BY sort;
```

##### 1.2. Полный запрос для страницы группы
```
GET /api/v1/groups?slug=designsystem
GET /api/v1/groups/full?slug=designsystem
```
Возвращает полные данные группы со всеми полями (включая SEO).

**Ответ (все поля):**
```json
[
  {
    "slug": "designsystem",
    "title_ru": "Дизайн-система",
    "title_en": "designsystem",
    "badge": "",
    "cover": "images/groups/designsystem.webp",
    "cover_notion": "https://...",
    "description_ru": "Компоненты, гайдлайны, брендбуки",
    "description_seo": "...",
    "keywords_seo": "...",
    "og_description": "...",
    "og_image": "...",
    "og_title": "...",
    "sort": 3,
    "title_seo": "..."
  }
]
```

**SQL запрос для полной группы:**
```sql
SELECT * FROM `groups` WHERE slug = ?;
```

#### 2. Подгруппы (Subgroups)

##### 2.1. Полный запрос (для страницы группы)
```
GET /api/v1/subgroups
GET /api/v1/subgroups?group_slug=designsystem
```
Возвращает все подгруппы (или подгруппы конкретной группы).

**Ответ:**
```json
[
  {
    "slug": "3d",
    "title_ru": "3D",
    "description_ru": "О 3D-дизайне и моделировании",
    "title_en": "3d",
    "status": ""
  }
]
```

**SQL запрос:**
```sql
SELECT * FROM subgroups;
-- или с фильтром по группе (если нужны только подгруппы группы):
SELECT s.* 
FROM subgroups s
INNER JOIN data d ON s.slug = d.subgroup_slug
WHERE d.group_slug = ?
GROUP BY s.slug;
```

#### 3. Карточки/Данные (Data)

##### 3.1. Легковесный запрос для списков (оптимизация)
```
GET /api/v1/data/list
GET /api/v1/data/list?status_slug=published
GET /api/v1/data/list?group_slug=designsystem
```
Возвращает только необходимые поля для отображения карточек в списках.

**Ответ (только нужные поля):**
```json
[
  {
    "slug": "001",
    "title": "Гайд по текстам в интерфейсе",
    "cover": "images/covers/001.webp",
    "description": "",
    "group_slug": "designsystem",
    "subgroup_slug": "text",
    "status_slug": "published"
  }
]
```

**SQL запрос для легковесного списка:**
```sql
SELECT 
    d.slug,
    d.title,
    d.cover,
    d.description,
    d.group_slug,
    d.subgroup_slug,
    d.status_slug
FROM data d
WHERE d.status_slug = 'published'
ORDER BY d.slug;
```

##### 3.2. Полный запрос для детальной страницы
```
GET /api/v1/data?slug=001
GET /api/v1/data/full?slug=001
```
Возвращает полные данные карточки со всеми полями (без авторов).

**Ответ (все поля карточки, без авторов):**
```json
[
  {
    "slug": "001",
    "title": "Гайд по текстам в интерфейсе",
    "cover": "images/covers/001.webp",
    "cover_notion": "",
    "url_seo_yandex": "gajd-po-tekstam-v-interfejse-001",
    "url_seo_google": "",
    "description": "",
    "status_slug": "published",
    "group_slug": "designsystem",
    "subgroup_slug": "text",
    "version_slug": "1",
    "url_title_1": "Прототип",
    "url_1": "https://...",
    "url_title_2": "Макеты",
    "url_2": "https://...",
    "url_title_3": "",
    "url_3": "",
    "url_title_4": "",
    "url_4": "",
    "url_title_5": "",
    "url_5": "",
    "url_title_6": "",
    "url_6": "",
    "start_date": "",
    "end_date": "",
    "published": "",
    "created_at": "May 6, 2025 10:57 PM",
    "updated_at": "October 24, 2025 12:59 AM",
    "summary_ai": "...",
    "detail": null,
    "comment": ""
  }
]
```

**SQL запрос для полной карточки (без авторов):**
```sql
SELECT * FROM data WHERE slug = ?;
```

#### 4. Авторы карточки (Card Authors)
```
GET /api/v1/data/{slug}/authors
GET /api/v1/card-authors?card_slug=001
```
Возвращает список авторов для конкретной карточки.

**Ответ:**
```json
[
  {
    "slug": "ozon-design",
    "title_ru": "Ozon Design",
    "title_en": "Ozon Design",
    "avatar": "images/authors/ozon-design.webp"
  }
]
```

**SQL запрос для получения авторов карточки:**
```sql
SELECT 
    a.slug,
    a.title_ru,
    a.title_en,
    a.avatar
FROM authors a
INNER JOIN card_authors ca ON a.slug = ca.author_slug
WHERE ca.card_slug = ?;
```

##### 3.3. Альтернативный вариант: параметр fields
```
GET /api/v1/data?status_slug=published&fields=slug,title,cover,description,group_slug,subgroup_slug
GET /api/v1/data?slug=001&fields=*
```
Позволяет указать, какие поля нужны через параметр `fields`.

**Примеры:**
- `fields=slug,title,cover,description,group_slug,subgroup_slug` - только нужные поля
- `fields=*` или без параметра - все поля

## Изменения в файлах

### 1. `js/index.js`

**Было:**
```javascript
const [dataResponse, groupsResponse] = await Promise.all([
    fetch('data/data.json'),
    fetch('data/group.json')
]);

const data = await dataResponse.json();
const groups = await groupsResponse.json();
```

**Станет (оптимизированный вариант):**
```javascript
const API_BASE = '/api/v1'; // или полный URL вашего API

// Используем легковесные эндпоинты для главной страницы
// 1. Легковесный groups (только основные поля)
// 2. Легковесный cards (только для превью)
const [dataResponse, groupsResponse] = await Promise.all([
    fetch(`${API_BASE}/data/list?status_slug=published`),
    fetch(`${API_BASE}/groups/list`)
]);

const data = await dataResponse.json();
const groups = await groupsResponse.json();
```

### 2. `js/group.js`

**Было:**
```javascript
const [dataResponse, groupsResponse, subgroupsResponse] = await Promise.all([
    fetch('data/data.json'),
    fetch('data/group.json'),
    fetch('data/subgroup.json')
]);
```

**Станет (оптимизированный вариант):**
```javascript
const API_BASE = '/api/v1';
const params = new URLSearchParams(window.location.search);
const groupSlug = params.get('slug');

// Для страницы группы нужны:
// 1. Полный group (со всеми SEO полями)
// 2. Полный subgroups (все подгруппы)
// 3. Легковесный cards (только для списка)
const [groupResponse, subgroupsResponse, dataResponse] = await Promise.all([
    fetch(`${API_BASE}/groups?slug=${groupSlug}`),
    fetch(`${API_BASE}/subgroups`),
    fetch(`${API_BASE}/data/list?group_slug=${groupSlug}`)
]);

const group = (await groupResponse.json())[0];
const subgroups = await subgroupsResponse.json();
const data = await dataResponse.json();
```

**Важно:** 
- Для страницы группы используем полный запрос группы (нужны SEO поля)
- Подгруппы загружаем полностью (нужны для разбивки)
- Карточки используем легковесный запрос (только для списка)

### 3. `js/detail.js`

**Было:**
```javascript
const [dataResponse, groupsResponse, subgroupsResponse] = await Promise.all([
    fetch('data/data.json'),
    fetch('data/group.json'),
    fetch('data/subgroup.json')
]);
```

**Станет (оптимизированный вариант):**
```javascript
const API_BASE = '/api/v1';
const params = new URLSearchParams(window.location.search);
const slug = params.get('slug');

// Для детальной страницы нужны:
// 1. Полный card (все поля карточки)
// 2. Авторы карточки (отдельный запрос)
// 3. Groups и subgroups (для breadcrumbs)
const [cardResponse, authorsResponse, groupsResponse, subgroupsResponse] = await Promise.all([
    fetch(`${API_BASE}/data?slug=${slug}`),
    fetch(`${API_BASE}/data/${slug}/authors`),
    fetch(`${API_BASE}/groups/list`),
    fetch(`${API_BASE}/subgroups`)
]);

const card = (await cardResponse.json())[0];
const authors = await authorsResponse.json();
const groups = await groupsResponse.json();
const subgroups = await subgroupsResponse.json();

// Объединяем авторов с карточкой для совместимости
card.authors = authors.map(a => a.title_ru);

// Используем данные
displayDetail(card, groups, subgroups);
```

**Важно:** 
- Для детальной страницы запрашиваем полную карточку по `slug`
- Авторы загружаются отдельным запросом (оптимизация)
- API должен вернуть массив с одним элементом или объект
- Нужно обработать случай, когда карточка не найдена

**Дополнительно:** Функция `getRandomCardRedirect` должна быть изменена (используем легковесный запрос):

```javascript
window.getRandomCardRedirect = async function() {
    // Для выбора случайной карточки нужен только slug, используем легковесный запрос
    const response = await fetch(`${API_BASE}/data/list?status_slug=published`);
    const data = await response.json();
    const randomIndex = Math.floor(Math.random() * data.length);
    const randomSlug = data[randomIndex].slug;
    window.location.href = `detail.html?slug=${randomSlug}`;
};
```

### 4. `js/drawer.js`

**Было:**
```javascript
const [dataResponse, subgroupsResponse, groupsResponse] = await Promise.all([
    fetch('data/data.json'),
    fetch('data/subgroup.json'),
    fetch('data/group.json')
]);
```

**Станет (оптимизированный вариант):**
```javascript
const API_BASE = '/api/v1';

// Для поиска нужны только slug, group_slug, subgroup_slug
// Используем легковесный запрос для карточек
const [dataResponse, subgroupsResponse, groupsResponse] = await Promise.all([
    fetch(`${API_BASE}/data/list?status_slug=published`),
    fetch(`${API_BASE}/subgroups`),
    fetch(`${API_BASE}/groups/list`)
]);
```

### 5. `scripts/generate-sitemap.js`

**Было:**
```javascript
const groupPath = path.join(__dirname, 'data', 'group.json');
const dataPath = path.join(__dirname, 'data', 'data.json');

const groups = JSON.parse(fs.readFileSync(groupPath, 'utf8'));
const cards = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
```

**Станет:**
```javascript
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';

async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

async function main() {
    const [groups, cards] = await Promise.all([
        fetchData(`${API_BASE}/groups`),
        fetchData(`${API_BASE}/data?status_slug=published`)
    ]);
    
    const sitemap = generateSitemap(groups, cards);
    fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap, 'utf8');
    console.log('sitemap.xml создан!');
}
```

**Примечание:** Для Node.js скрипта может потребоваться установка пакета `node-fetch` или использование встроенного `fetch` (Node.js 18+).

## Особенности работы с данными

### Авторы (Authors)

В JSON файле поле `author_slug` содержит строку с одним автором. В MySQL реализована связь many-to-many через таблицу `card_authors`.

**Важно:** API должен возвращать массив авторов в поле `authors`:

```json
{
  "slug": "001",
  "title": "...",
  "authors": ["Ozon Design"]
}
```

Если авторов несколько:
```json
{
  "slug": "002",
  "title": "...",
  "authors": ["Автор 1", "Автор 2"]
}
```

### Версии (Versions)

В JSON файле `version_slug` может быть числом (например, `1`, `6`). В MySQL это VARCHAR(255), который ссылается на `versions.slug`.

**Важно:** При миграции данных нужно преобразовать числовые значения в строки:
- `1` → `"1"`
- `6` → `"6"`

API должен возвращать `version_slug` как строку.

### Пустые значения

В JSON могут быть пустые строки `""` или `null`. В MySQL они хранятся как `NULL` или пустые строки. API должен возвращать их в том же формате, что и JSON, для совместимости.

## Конфигурация API Base URL

Рекомендуется создать конфигурационный файл для управления базовым URL API:

**Создать файл `js/config.js`:**
```javascript
// Конфигурация API
const CONFIG = {
    // Для разработки
    API_BASE: '/api/v1',
    
    // Для продакшена (пример)
    // API_BASE: 'https://api.bibliotechka.online/v1',
    
    // Или использовать переменную окружения
    // API_BASE: process.env.API_BASE || '/api/v1'
};

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
```

**Использование в файлах:**
```javascript
// В начале файла
const API_BASE = window.CONFIG?.API_BASE || '/api/v1';
```

## Обработка ошибок

Добавьте обработку ошибок при загрузке данных:

```javascript
try {
    const response = await fetch(`${API_BASE}/data`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // ... обработка данных
} catch (error) {
    console.error('Ошибка загрузки данных:', error);
    // Показать сообщение пользователю или использовать fallback
}
```

## Кэширование

Для улучшения производительности можно добавить кэширование на стороне клиента:

```javascript
const cache = new Map();

async function fetchWithCache(url) {
    if (cache.has(url)) {
        return cache.get(url);
    }
    
    const response = await fetch(url);
    const data = await response.json();
    cache.set(url, data);
    return data;
}
```

## Чеклист миграции

### API эндпоинты
- [ ] Создать API сервер с эндпоинтами для groups, subgroups, data, authors
- [ ] Реализовать легковесный эндпоинт `/api/v1/groups/list` для главной страницы
- [ ] Реализовать полный эндпоинт `/api/v1/groups?slug=...` для страницы группы
- [ ] Реализовать эндпоинт `/api/v1/subgroups` для подгрупп
- [ ] Реализовать легковесный эндпоинт `/api/v1/data/list` для списков карточек
- [ ] Реализовать полный эндпоинт `/api/v1/data?slug=...` для детальных страниц
- [ ] Реализовать эндпоинт `/api/v1/data/{slug}/authors` для получения авторов карточки

### Обновление JavaScript файлов
- [ ] Обновить `js/index.js` - использовать легковесные запросы `/groups/list` и `/data/list`
- [ ] Обновить `js/group.js` - использовать полный `/groups?slug=...`, полный `/subgroups`, легковесный `/data/list`
- [ ] Обновить `js/detail.js` - использовать полный `/data?slug=...` и отдельный `/data/{slug}/authors`
- [ ] Обновить `js/drawer.js` - использовать легковесные запросы для поиска
- [ ] Обновить `scripts/generate-sitemap.js` - использовать API

### Конфигурация и обработка ошибок
- [ ] Создать `js/config.js` для конфигурации API
- [ ] Добавить обработку ошибок во все места загрузки данных
- [ ] Добавить обработку случая, когда карточка/группа не найдена

### Тестирование
- [ ] Протестировать главную страницу (index.html)
- [ ] Протестировать страницу группы (group.html)
- [ ] Протестировать детальную страницу (detail.html)
- [ ] Проверить работу фильтрации по статусу (published)
- [ ] Проверить работу фильтрации по группе и подгруппе
- [ ] Проверить отображение авторов (отдельный запрос)
- [ ] Проверить SEO мета-теги на странице группы
- [ ] Проверить производительность: сравнить размер ответов легковесных и полных запросов

## Оптимизация запросов

### Принцип разделения запросов по страницам

Для уменьшения нагрузки на базу данных и ускорения загрузки страниц используется оптимизированная структура запросов:

#### Главная страница (index.html)

1. **Легковесный groups** (`/api/v1/groups/list`)
   - Только: `slug`, `title_ru`, `cover`, `description_ru`, `sort`
   - Для отображения списка групп

2. **Легковесный cards** (`/api/v1/data/list?status_slug=published`)
   - Только: `slug`, `title`, `cover`, `description`, `group_slug`, `subgroup_slug`, `status_slug`
   - Для превью карточек

#### Страница группы (group.html)

1. **Полный group** (`/api/v1/groups?slug=...`)
   - Все поля группы, включая SEO: `description_seo`, `keywords_seo`, `og_*`, `title_seo`
   - Нужны для SEO и мета-тегов страницы

2. **Полный subgroups** (`/api/v1/subgroups`)
   - Все подгруппы для разбивки карточек по категориям

3. **Легковесный cards** (`/api/v1/data/list?group_slug=...`)
   - Только поля для списка карточек в группе

#### Детальная страница (detail.html)

1. **Полный card** (`/api/v1/data?slug=...`)
   - Все поля карточки (без авторов)

2. **Авторы карточки** (`/api/v1/data/{slug}/authors`)
   - Отдельный запрос для получения авторов
   - Оптимизация: авторы загружаются только когда нужны

### Преимущества оптимизации

- **Меньше данных передается** - для списка из 100 карточек вместо ~50KB на карточку передается ~500 байт
- **Быстрее выполнение** - нет JOIN с авторами для списков, нет лишних полей
- **Меньше нагрузка на БД** - меньше данных читается с диска
- **Лучший UX** - страницы загружаются быстрее
- **Гибкость** - авторы загружаются отдельно только когда нужны

### Структура запросов по страницам

**index.html:**
```javascript
// 1. Легковесный groups
fetch(`${API_BASE}/groups/list`)
// 2. Легковесный cards
fetch(`${API_BASE}/data/list?status_slug=published`)
```

**group.html:**
```javascript
// 1. Полный group
fetch(`${API_BASE}/groups?slug=${groupSlug}`)
// 2. Полный subgroups
fetch(`${API_BASE}/subgroups`)
// 3. Легковесный cards
fetch(`${API_BASE}/data/list?group_slug=${groupSlug}`)
```

**detail.html:**
```javascript
// 1. Полный card
fetch(`${API_BASE}/data?slug=${slug}`)
// 2. Авторы карточки
fetch(`${API_BASE}/data/${slug}/authors`)
```

## Пример SQL запросов для API

### Главная страница (index.html)

#### 1. Легковесный список групп
```sql
SELECT 
    slug,
    title_ru,
    cover,
    description_ru,
    sort
FROM `groups`
ORDER BY sort;
```

#### 2. Легковесный список карточек
```sql
SELECT 
    slug,
    title,
    cover,
    description,
    group_slug,
    subgroup_slug,
    status_slug
FROM data
WHERE status_slug = 'published'
ORDER BY slug;
```

### Страница группы (group.html)

#### 1. Полная группа (со всеми SEO полями)
```sql
SELECT * FROM `groups` WHERE slug = ?;
```

#### 2. Все подгруппы
```sql
SELECT * FROM subgroups;
```

#### 3. Легковесный список карточек группы
```sql
SELECT 
    slug,
    title,
    cover,
    description,
    group_slug,
    subgroup_slug,
    status_slug
FROM data
WHERE group_slug = ?
ORDER BY slug;
```

### Детальная страница (detail.html)

#### 1. Полная карточка (без авторов)
```sql
SELECT * FROM data WHERE slug = ?;
```

#### 2. Авторы карточки (отдельный запрос)
```sql
SELECT 
    a.slug,
    a.title_ru,
    a.title_en,
    a.avatar
FROM authors a
INNER JOIN card_authors ca ON a.slug = ca.author_slug
WHERE ca.card_slug = ?;
```

### Дополнительные запросы

#### Получить только slug для случайной карточки
```sql
SELECT slug
FROM data
WHERE status_slug = 'published'
ORDER BY RAND()
LIMIT 1;
```

#### Получить подгруппы конкретной группы (альтернативный вариант)
```sql
SELECT DISTINCT s.* 
FROM subgroups s
INNER JOIN data d ON s.slug = d.subgroup_slug
WHERE d.group_slug = ?
ORDER BY s.title_ru;
```

## Рекомендации по реализации API

### Структура эндпоинтов

Рекомендуется создать следующие эндпоинты:

1. **`GET /api/v1/groups/list`** - легковесный список групп (для главной)
2. **`GET /api/v1/groups?slug=...`** - полная группа (для страницы группы)
3. **`GET /api/v1/subgroups`** - все подгруппы
4. **`GET /api/v1/data/list`** - легковесный список карточек
5. **`GET /api/v1/data?slug=...`** - полная карточка (без авторов)
6. **`GET /api/v1/data/{slug}/authors`** - авторы карточки

### Пример реализации (псевдокод)

```javascript
// 1. Легковесный список групп
app.get('/api/v1/groups/list', async (req, res) => {
  const query = `
    SELECT slug, title_ru, cover, description_ru, sort
    FROM groups
    ORDER BY sort
  `;
  const results = await db.query(query);
  res.json(results);
});

// 2. Полная группа
app.get('/api/v1/groups', async (req, res) => {
  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({ error: 'slug parameter required' });
  }
  const query = `SELECT * FROM groups WHERE slug = ?`;
  const results = await db.query(query, [slug]);
  res.json(results);
});

// 3. Все подгруппы
app.get('/api/v1/subgroups', async (req, res) => {
  const query = `SELECT * FROM subgroups`;
  const results = await db.query(query);
  res.json(results);
});

// 4. Легковесный список карточек
app.get('/api/v1/data/list', async (req, res) => {
  const { status_slug, group_slug } = req.query;
  let query = `
    SELECT slug, title, cover, description, 
           group_slug, subgroup_slug, status_slug
    FROM data
    WHERE 1=1
  `;
  const params = [];
  if (status_slug) {
    query += ` AND status_slug = ?`;
    params.push(status_slug);
  }
  if (group_slug) {
    query += ` AND group_slug = ?`;
    params.push(group_slug);
  }
  query += ` ORDER BY slug`;
  const results = await db.query(query, params);
  res.json(results);
});

// 5. Полная карточка (без авторов)
app.get('/api/v1/data', async (req, res) => {
  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({ error: 'slug parameter required' });
  }
  const query = `SELECT * FROM data WHERE slug = ?`;
  const results = await db.query(query, [slug]);
  res.json(results);
});

// 6. Авторы карточки
app.get('/api/v1/data/:slug/authors', async (req, res) => {
  const { slug } = req.params;
  const query = `
    SELECT a.slug, a.title_ru, a.title_en, a.avatar
    FROM authors a
    INNER JOIN card_authors ca ON a.slug = ca.author_slug
    WHERE ca.card_slug = ?
  `;
  const results = await db.query(query, [slug]);
  res.json(results);
});
```

## Примечания

1. **CORS:** Если API находится на другом домене, убедитесь, что настроены правильные CORS заголовки.

2. **Производительность:** Для больших объемов данных рассмотрите возможность пагинации:
   ```
   GET /api/v1/data/list?page=1&limit=50
   ```

3. **Безопасность:** Не передавайте чувствительные данные (пароли, токены) в URL параметрах. Используйте заголовки или POST запросы для аутентификации.

4. **Обратная совместимость:** На время миграции можно оставить JSON файлы как fallback на случай ошибок API.

5. **Кэширование на сервере:** Рассмотрите возможность кэширования результатов легковесных запросов, так как они реже меняются.

6. **Индексы БД:** Убедитесь, что на полях `status_slug`, `group_slug`, `subgroup_slug` и `slug` есть индексы для быстрого поиска.

