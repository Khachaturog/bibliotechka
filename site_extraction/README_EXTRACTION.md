# Скрипт извлечения данных с сайтов

## Быстрый старт

### 1. Установка зависимостей

```bash
pip install -r requirements.txt
```

Или вручную:
```bash
pip install requests beautifulsoup4 pymysql lxml
```

### 2. Запуск теста на 5 сайтах

```bash
python scripts/extract-website-data.py --limit 5
```

### 3. Проверка результатов

Результаты будут в папке `extracted_data/`:
- `001.json`, `002.json`, ... - JSON файлы с данными
- `extraction.log` - лог обработки
- `stats.json` - общая статистика

## Параметры запуска

- `--limit N` - обработать только N сайтов (по умолчанию 5)
- `--skip-existing` - пропустить уже обработанные сайты

## Примеры

```bash
# Тест на 5 сайтах
python scripts/extract-website-data.py --limit 5

# Обработать все сайты
python scripts/extract-website-data.py

# Пропустить уже обработанные
python scripts/extract-website-data.py --skip-existing
```

## Структура JSON файла

Каждый файл `{slug}.json` содержит:
- `source` - информация об источнике
- `title`, `description`, `author` - метаданные
- `og_*`, `twitter_*` - Open Graph и Twitter метаданные
- `body_text` - очищенный текст из body
- `headings_h1` до `headings_h6` - массивы заголовков
- `paragraphs`, `links`, `images` - структурированный контент
- `seo_*` - SEO данные
- `stats` - статистика извлечения

Подробнее см. `docs/WEBSITE_EXTRACTION_RULES.md`
