# Правила извлечения данных с сайтов

## Описание

Скрипт `extract-website-data.py` извлекает структурированные метаданные и контент с внешних сайтов для последующего AI-анализа и генерации кратких описаний.

## Структура данных

Для каждого сайта создается один JSON файл: `extracted_data/{slug}.json`

### Формат JSON файла

```json
{
  "source": {
    "card_slug": "001",
    "url": "https://example.com",
    "url_title": "Название ссылки",
    "extracted_at": "2026-01-27T12:00:00Z"
  },
  "title": "Заголовок страницы",
  "description": "Meta description",
  "keywords": ["keyword1", "keyword2"],
  "author": "Автор",
  "author_meta": ["author1", "author2"],
  "og_title": "Open Graph title",
  "og_description": "Open Graph description",
  "og_image": "https://...",
  "twitter_title": "Twitter title",
  "twitter_description": "Twitter description",
  "canonical": "https://...",
  "language": "ru",
  "seo_robots": "index, follow",
  "seo_structured": {},
  "seo_breadcrumbs": [],
  "body_text": "Очищенный текст из body",
  "headings_h1": ["Заголовок 1"],
  "headings_h2": ["Подзаголовок 1", "Подзаголовок 2"],
  "headings_h3": [],
  "headings_h4": [],
  "headings_h5": [],
  "headings_h6": [],
  "paragraphs": ["Параграф 1", "Параграф 2"],
  "links": [
    {"text": "Текст ссылки", "href": "https://..."}
  ],
  "images": [
    {"alt": "Описание", "src": "https://..."}
  ],
  "stats": {
    "word_count": 500,
    "char_count": 3000,
    "extraction_quality": "high"
  }
}
```

## Правила извлечения

### Метаданные (из `<head>`)

- **title**: Из тега `<title>`
- **description**: Из `<meta name="description">`
- **keywords**: Из `<meta name="keywords">` (разделение по запятой)
- **author**: Из `<meta name="author">`
- **author_meta**: Все мета-теги с `name` содержащим "author"
- **og_title**: Из `<meta property="og:title">`
- **og_description**: Из `<meta property="og:description">`
- **og_image**: Из `<meta property="og:image">`
- **twitter_title**: Из `<meta name="twitter:title">`
- **twitter_description**: Из `<meta name="twitter:description">`
- **canonical**: Из `<link rel="canonical">`
- **language**: Из атрибута `lang` тега `<html>`
- **seo_robots**: Из `<meta name="robots">`

### SEO данные

- **seo_structured**: JSON-LD данные из `<script type="application/ld+json">`
- **seo_breadcrumbs**: Навигационные цепочки из `<nav aria-label*="breadcrumb">`

### Контент (из `<body>`)

- **body_text**: Весь текст из body (очищенный, нормализованные пробелы)
- **headings_h1** до **headings_h6**: Массивы текстов заголовков
- **paragraphs**: Массив текстов параграфов
- **links**: Массив объектов `{"text": "...", "href": "..."}`
- **images**: Массив объектов `{"alt": "...", "src": "..."}`

### Статистика

- **word_count**: Количество слов в body_text
- **char_count**: Количество символов в body_text
- **extraction_quality**: "high" (>500 символов), "medium" (100-500), "low" (<100)

## Правила очистки HTML

1. Удаление `<script>` тегов
2. Удаление `<style>` тегов
3. Удаление HTML комментариев
4. Удаление элементов навигации (nav, header, footer, .navigation, .menu, .sidebar)
5. Удаление рекламы (.advertisement, .ads, .ad, [class*='ad-'], [id*='ad-'])
6. Удаление пустых элементов
7. Нормализация пробелов (множественные пробелы → один)

## Обработка ошибок

- **Недоступные сайты**: Запись в лог, пропуск
- **Таймауты**: Повтор через 5 секунд (1 попытка)
- **Некорректный HTML**: Частичное извлечение с `extraction_quality: "low"`
- **Пустые поля**: Сохраняются как пустые строки `""`, пустые массивы `[]` или `null`

## Использование

### Базовый запуск (5 сайтов для теста)

```bash
python scripts/extract-website-data.py --limit 5
```

### Обработка всех сайтов

```bash
python scripts/extract-website-data.py
```

### Пропуск уже обработанных

```bash
python scripts/extract-website-data.py --skip-existing
```

### Кастомный лимит

```bash
python scripts/extract-website-data.py --limit 10
```

## Зависимости

Установка зависимостей:

```bash
pip install -r requirements.txt
```

Или вручную:

```bash
pip install requests beautifulsoup4 pymysql lxml
```

## Логи и статистика

- **Лог**: `extracted_data/extraction.log`
- **Статистика**: `extracted_data/stats.json`
- **Результаты**: `extracted_data/{slug}.json`

## Примеры обработки разных типов сайтов

### Статические HTML сайты
- Обычно хорошо извлекаются все метаданные
- Body текст может содержать много навигации (удаляется)

### SPA (Single Page Applications)
- Метаданные могут быть в `<head>`
- Body может быть пустым или содержать только скрипты (требует рендеринга JS)

### WordPress сайты
- Обычно хорошие метаданные
- Structured data в JSON-LD формате

## Troubleshooting

### Ошибка подключения к БД
- Проверьте настройки в `extract-website-data-config.json`
- Убедитесь, что сервер доступен

### Пустой body_text
- Возможно, сайт использует JavaScript для рендеринга
- Проверьте исходный HTML в логах

### Низкое качество извлечения
- Проверьте, что сайт доступен
- Убедитесь, что HTML корректен
- Возможно, требуется настройка селекторов для очистки
