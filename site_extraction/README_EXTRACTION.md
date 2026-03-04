# Скрипт извлечения данных с сайтов

## Быстрый старт

### 1. Установка зависимостей

```bash
pip install -r requirements.txt
```

Если планируете извлечение с JS-рендерингом (SPA/Figma и т.п.), один раз установите браузер:

```bash
python -m playwright install chromium
```

Или вручную:
```bash
pip install requests beautifulsoup4 pymysql lxml playwright
```

### 2. Настройка конфига (БД)

Скопируйте пример и заполните доступы (локально, файл не должен попадать в git):

```bash
cp site_extraction/extract-website-data-config.example.json site_extraction/extract-website-data-config.json
```

Либо укажите путь к конфигу через переменную окружения `EXTRACT_WEBSITE_DATA_CONFIG`.

### 3. Запуск теста на 5 сайтах

```bash
python site_extraction/extract-website-data.py --limit 5
```

### 4. Проверка результатов

Результаты будут в папке `extracted_data/`:
- `001.json`, `002.json`, ... - JSON файлы с данными
- `extraction.log` - лог обработки
- `stats.json` - общая статистика

## Параметры запуска

- `--limit N` - обработать только N сайтов (по умолчанию 5)
- `--skip-existing` - пропустить уже обработанные сайты
- `--render-js` - всегда рендерить страницу в headless-браузере (нужно для SPA/страниц без контента в сыром HTML, но медленнее)
- `--smart-render` - сначала `requests`, а Playwright только если контент пустой/короткий (обычно быстрее)

## Примеры

```bash
# Тест на 5 сайтах
python site_extraction/extract-website-data.py --limit 5

# Обработать все сайты
python site_extraction/extract-website-data.py

# Пропустить уже обработанные
python site_extraction/extract-website-data.py --skip-existing

# Сгенерировать отчет по "проваленным" ссылкам (по extraction.log)
# (создаст extracted_data/failed.jsonl; опционально можно включить CSV)
python site_extraction/build-failed-report.py --only-missing-files
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
