#!/usr/bin/env python3
"""
Скрипт для извлечения структурированных данных с внешних сайтов.

Использование:
    python3 scripts/extract-website-data.py
    python3 scripts/extract-website-data.py --limit 10
    python3 scripts/extract-website-data.py --skip-existing
"""

import sys
import os
import json
import time
import logging
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from typing import Dict, List, Optional, Any

import requests
from bs4 import BeautifulSoup
import pymysql
from pymysql.cursors import DictCursor

# Playwright импортируем лениво: он нужен только для режима --render-js

_PW = None
_PW_BROWSER = None
_PW_CONTEXT = None

# Добавляем путь к скриптам в sys.path
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(PROJECT_ROOT))

def load_config() -> Dict[str, Any]:
    """
    Загружает конфигурацию.

    Приоритет:
    1) env EXTRACT_WEBSITE_DATA_CONFIG (путь к json)
    2) site_extraction/extract-website-data-config.json (локально, НЕ в git)
    3) site_extraction/extract-website-data-config.example.json (пример)
    """
    env_path = os.getenv("EXTRACT_WEBSITE_DATA_CONFIG")
    if env_path:
        config_path = Path(env_path).expanduser()
    else:
        config_path = SCRIPT_DIR / "extract-website-data-config.json"
        if not config_path.exists():
            config_path = SCRIPT_DIR / "extract-website-data-config.example.json"

    if not config_path.exists():
        raise FileNotFoundError(
            "Не найден конфиг. Создайте `site_extraction/extract-website-data-config.json` "
            "или задайте env `EXTRACT_WEBSITE_DATA_CONFIG`."
        )

    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def apply_env_overrides(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Переопределяет конфиг из env (удобно для CI/локалки, без секретов в репо).

    Поддерживаемые переменные:
    - EXTRACT_DB_HOST, EXTRACT_DB_PORT, EXTRACT_DB_USER, EXTRACT_DB_PASSWORD, EXTRACT_DB_NAME, EXTRACT_DB_CHARSET
    """
    cfg = dict(config)
    cfg.setdefault("database", {})

    db = dict(cfg["database"])
    if os.getenv("EXTRACT_DB_HOST"):
        db["host"] = os.getenv("EXTRACT_DB_HOST")
    if os.getenv("EXTRACT_DB_PORT"):
        try:
            db["port"] = int(os.getenv("EXTRACT_DB_PORT", "3306"))
        except ValueError:
            pass
    if os.getenv("EXTRACT_DB_USER"):
        db["user"] = os.getenv("EXTRACT_DB_USER")
    if os.getenv("EXTRACT_DB_PASSWORD"):
        db["password"] = os.getenv("EXTRACT_DB_PASSWORD")
    if os.getenv("EXTRACT_DB_NAME"):
        db["database"] = os.getenv("EXTRACT_DB_NAME")
    if os.getenv("EXTRACT_DB_CHARSET"):
        db["charset"] = os.getenv("EXTRACT_DB_CHARSET")

    cfg["database"] = db
    return cfg


CONFIG = apply_env_overrides(load_config())

DB_CONFIG = CONFIG['database']
EXTRACTION_CONFIG = CONFIG['extraction']
CLEANING_CONFIG = CONFIG['cleaning']
SELECTORS_TO_REMOVE = CONFIG.get('selectors_to_remove', [])

# Настройка логирования
LOG_DIR = PROJECT_ROOT / EXTRACTION_CONFIG['output_dir']
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / 'extraction.log'

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


def get_db_connection():
    """Создает подключение к БД"""
    try:
        conn = pymysql.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"Ошибка подключения к БД: {e}")
        sys.exit(1)


def get_urls_from_db(limit: Optional[int] = None, skip_existing: bool = False):
    """Получает URL из БД (только url_1 для каждого slug)"""
    conn = get_db_connection()
    cursor = conn.cursor(DictCursor)
    
    try:
        query = """
            SELECT slug, url_1, url_title_1 
            FROM data 
            WHERE url_1 IS NOT NULL AND url_1 != ''
            ORDER BY slug
        """
        if limit:
            query += f" LIMIT {limit}"
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        urls = []
        existing_files = set()
        
        if skip_existing:
            output_dir = PROJECT_ROOT / EXTRACTION_CONFIG['output_dir']
            if output_dir.exists():
                existing_files = {f.stem for f in output_dir.glob('*.json')}
        
        for row in rows:
            slug = row['slug']
            url = row['url_1']
            url_title = row.get('url_title_1', '')
            
            # Пропускаем если файл уже существует
            if skip_existing and slug in existing_files:
                logger.info(f"Пропуск {slug} - файл уже существует")
                continue
            
            if url and url.strip():
                urls.append({
                    'slug': slug,
                    'url': url.strip(),
                    'url_title': url_title or ''
                })
        
        return urls
    finally:
        cursor.close()
        conn.close()


def download_html(url: str) -> Optional[str]:
    """Скачивает HTML страницы"""
    try:
        headers = {
            'User-Agent': EXTRACTION_CONFIG['user_agent'],
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        }
        
        response = requests.get(
            url,
            headers=headers,
            timeout=EXTRACTION_CONFIG['timeout'],
            allow_redirects=True
        )
        response.raise_for_status()
        
        # Определяем кодировку
        if response.encoding:
            response.encoding = response.apparent_encoding or 'utf-8'
        
        return response.text
    except requests.exceptions.Timeout:
        logger.warning(f"Таймаут при загрузке {url}")
        return None
    except requests.exceptions.RequestException as e:
        logger.warning(f"Ошибка при загрузке {url}: {e}")
        return None
    except Exception as e:
        logger.error(f"Неожиданная ошибка при загрузке {url}: {e}")
        return None


def _get_playwright_page():
    """Ленивая инициализация Playwright + Chromium (переиспользуем между URL)."""
    global _PW, _PW_BROWSER, _PW_CONTEXT
    if _PW_CONTEXT is not None:
        return _PW_CONTEXT.new_page()

    try:
        from playwright.sync_api import sync_playwright
    except Exception as e:
        logger.error(
            "Playwright не установлен или не импортируется. "
            "Установите зависимости и выполните `python -m playwright install chromium`."
        )
        logger.debug(f"Playwright import error: {e}")
        return None

    _PW = sync_playwright().start()
    _PW_BROWSER = _PW.chromium.launch(headless=True)

    user_agent = EXTRACTION_CONFIG.get("user_agent", "")
    accept_language = "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7"
    _PW_CONTEXT = _PW_BROWSER.new_context(
        user_agent=user_agent or None,
        locale="ru-RU",
        extra_http_headers={"Accept-Language": accept_language},
        viewport={"width": 1280, "height": 720},
    )
    return _PW_CONTEXT.new_page()


def close_playwright():
    """Закрывает Playwright, если был запущен."""
    global _PW, _PW_BROWSER, _PW_CONTEXT
    try:
        if _PW_CONTEXT is not None:
            _PW_CONTEXT.close()
    except Exception:
        pass
    try:
        if _PW_BROWSER is not None:
            _PW_BROWSER.close()
    except Exception:
        pass
    try:
        if _PW is not None:
            _PW.stop()
    except Exception:
        pass
    _PW_CONTEXT = None
    _PW_BROWSER = None
    _PW = None


def render_html_with_playwright(url: str) -> Optional[str]:
    """Рендерит страницу в headless-браузере и возвращает HTML после выполнения JS."""
    timeout_ms = int(EXTRACTION_CONFIG.get("timeout", 30) * 1000)
    # Для SPA часто нужен больший таймаут, если явно не задан.
    timeout_ms = int(EXTRACTION_CONFIG.get("render_timeout_ms", max(timeout_ms, 60000)))

    try:
        page = _get_playwright_page()
        if page is None:
            return None

        # Иногда networkidle висит на SPA, поэтому делаем мягко:
        page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
        try:
            page.wait_for_load_state("networkidle", timeout=5000)
        except Exception:
            pass

        # Дадим JS дорендерить контент
        page.wait_for_timeout(int(EXTRACTION_CONFIG.get("render_wait_ms", 2000)))

        html = page.content()
        try:
            page.close()
        except Exception:
            pass
        return html
    except Exception as e:
        logger.warning(f"Playwright render failed for {url}: {e}")
        return None


def extract_from_html(html: str):
    """Единая точка извлечения данных из HTML."""
    soup_raw = BeautifulSoup(html, 'html.parser')
    metadata = extract_metadata(soup_raw)
    seo_data = extract_seo_data(soup_raw)

    soup_clean = clean_html(html)
    content = extract_content(soup_clean)
    stats = calculate_stats(content, metadata)
    return metadata, content, seo_data, stats


def should_smart_render(metadata: Dict[str, Any], stats: Dict[str, Any]) -> bool:
    """
    Решение для smart-render: если контента мало, пробуем Playwright.
    Порог настраивается: extraction.smart_render_min_chars (по умолчанию 200).
    """
    min_chars = int(EXTRACTION_CONFIG.get("smart_render_min_chars", 200))
    char_count = int(stats.get("char_count", 0) or 0)
    if char_count >= min_chars:
        return False
    # Даже если текста мало, но есть хороший title/description, иногда этого достаточно —
    # но для простоты: если текста мало, пытаемся рендерить.
    return True


def clean_html(html: str) -> BeautifulSoup:
    """Очищает HTML от лишнего контента"""
    soup = BeautifulSoup(html, 'html.parser')
    
    # Удаление scripts
    if CLEANING_CONFIG['remove_scripts']:
        for script in soup.find_all('script'):
            script.decompose()
    
    # Удаление styles
    if CLEANING_CONFIG['remove_styles']:
        for style in soup.find_all('style'):
            style.decompose()
    
    # Удаление комментариев
    if CLEANING_CONFIG['remove_comments']:
        from bs4 import Comment
        for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
            comment.extract()
    
    # Удаление элементов по селекторам
    if CLEANING_CONFIG['remove_navigation'] or CLEANING_CONFIG['remove_footer'] or CLEANING_CONFIG['remove_ads']:
        for selector in SELECTORS_TO_REMOVE:
            for element in soup.select(selector):
                element.decompose()
    
    # Удаление пустых элементов
    for element in soup.find_all():
        if not element.get_text(strip=True) and not element.find_all(['img', 'svg']):
            element.decompose()
    
    return soup


def extract_metadata(soup: BeautifulSoup) -> Dict[str, Any]:
    """Извлекает метаданные из <head>"""
    metadata = {
        'title': '',
        'description': '',
        'keywords': [],
        'author': '',
        'author_meta': [],
        'og_title': '',
        'og_description': '',
        'og_image': '',
        'twitter_title': '',
        'twitter_description': '',
        'canonical': '',
        'language': 'ru',
        'seo_robots': ''
    }
    
    head = soup.find('head')
    if not head:
        return metadata
    
    # Title
    title_tag = head.find('title')
    if title_tag:
        metadata['title'] = title_tag.get_text(strip=True)
    
    # Meta description
    meta_desc = head.find('meta', attrs={'name': 'description'})
    if meta_desc and meta_desc.get('content'):
        metadata['description'] = meta_desc['content'].strip()
    
    # Meta keywords
    meta_keywords = head.find('meta', attrs={'name': 'keywords'})
    if meta_keywords and meta_keywords.get('content'):
        keywords = [k.strip() for k in meta_keywords['content'].split(',') if k.strip()]
        metadata['keywords'] = keywords
    
    # Author
    meta_author = head.find('meta', attrs={'name': 'author'})
    if meta_author and meta_author.get('content'):
        metadata['author'] = meta_author['content'].strip()
    
    # Авторы из других мета-тегов
    for meta_author_tag in head.find_all('meta', attrs={'name': lambda x: x and 'author' in x.lower()}):
        if meta_author_tag.get('content'):
            metadata['author_meta'].append(meta_author_tag['content'].strip())
    
    # Open Graph
    og_title = head.find('meta', attrs={'property': 'og:title'})
    if og_title and og_title.get('content'):
        metadata['og_title'] = og_title['content'].strip()
    
    og_desc = head.find('meta', attrs={'property': 'og:description'})
    if og_desc and og_desc.get('content'):
        metadata['og_description'] = og_desc['content'].strip()
    
    og_image = head.find('meta', attrs={'property': 'og:image'})
    if og_image and og_image.get('content'):
        metadata['og_image'] = og_image['content'].strip()
    
    # Twitter
    twitter_title = head.find('meta', attrs={'name': 'twitter:title'})
    if twitter_title and twitter_title.get('content'):
        metadata['twitter_title'] = twitter_title['content'].strip()
    
    twitter_desc = head.find('meta', attrs={'name': 'twitter:description'})
    if twitter_desc and twitter_desc.get('content'):
        metadata['twitter_description'] = twitter_desc['content'].strip()
    
    # Canonical
    canonical = head.find('link', attrs={'rel': 'canonical'})
    if canonical and canonical.get('href'):
        metadata['canonical'] = canonical['href'].strip()
    
    # Language
    html_tag = soup.find('html')
    if html_tag and html_tag.get('lang'):
        metadata['language'] = html_tag['lang'].strip()
    
    # Robots
    meta_robots = head.find('meta', attrs={'name': 'robots'})
    if meta_robots and meta_robots.get('content'):
        metadata['seo_robots'] = meta_robots['content'].strip()
    
    return metadata


def extract_seo_data(soup: BeautifulSoup) -> Dict[str, Any]:
    """Извлекает SEO данные (structured data, breadcrumbs)"""
    seo_data = {
        'seo_structured': {},
        'seo_breadcrumbs': []
    }
    
    # Structured data (JSON-LD)
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string)
            if isinstance(data, dict):
                seo_data['seo_structured'] = data
            elif isinstance(data, list) and data:
                seo_data['seo_structured'] = data[0]
        except:
            pass
    
    # Breadcrumbs (упрощенная версия)
    breadcrumb_nav = soup.find('nav', attrs={'aria-label': lambda x: x and 'breadcrumb' in x.lower()})
    if breadcrumb_nav:
        for link in breadcrumb_nav.find_all('a'):
            text = link.get_text(strip=True)
            href = link.get('href', '')
            if text:
                seo_data['seo_breadcrumbs'].append({'text': text, 'href': href})
    
    return seo_data


def extract_content(soup: BeautifulSoup) -> Dict[str, Any]:
    """Извлекает контент из <body>"""
    content = {
        'body_text': '',
        'headings_h1': [],
        'headings_h2': [],
        'headings_h3': [],
        'headings_h4': [],
        'headings_h5': [],
        'headings_h6': [],
        'paragraphs': [],
        'links': [],
        'images': []
    }
    
    body = soup.find('body')
    if not body:
        return content
    
    # Основной текст
    body_text = body.get_text(separator=' ', strip=True)
    if CLEANING_CONFIG['normalize_whitespace']:
        import re
        body_text = re.sub(r'\s+', ' ', body_text)
    content['body_text'] = body_text
    
    # Заголовки
    for level in range(1, 7):
        headings = body.find_all(f'h{level}')
        content[f'headings_h{level}'] = [h.get_text(strip=True) for h in headings if h.get_text(strip=True)]
    
    # Параграфы
    paragraphs = body.find_all('p')
    content['paragraphs'] = [p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)]
    
    # Ссылки
    links = body.find_all('a', href=True)
    for link in links:
        text = link.get_text(strip=True)
        href = link.get('href', '')
        if text or href:
            content['links'].append({'text': text, 'href': href})
    
    # Изображения
    images = body.find_all('img', src=True)
    for img in images:
        alt = img.get('alt', '')
        src = img.get('src', '')
        if src:
            content['images'].append({'alt': alt, 'src': src})
    
    return content


def calculate_stats(content: Dict[str, Any], metadata: Dict[str, Any]) -> Dict[str, Any]:
    """Вычисляет статистику"""
    body_text = content.get('body_text', '')
    word_count = len(body_text.split()) if body_text else 0
    char_count = len(body_text)
    
    # Определяем качество извлечения
    quality = 'high'
    if char_count < 100:
        quality = 'low'
    elif char_count < 500:
        quality = 'medium'
    
    return {
        'word_count': word_count,
        'char_count': char_count,
        'extraction_quality': quality
    }


def save_extracted_data(slug: str, url: str, url_title: str, metadata: Dict, content: Dict, seo_data: Dict, stats: Dict):
    """Сохраняет извлеченные данные в JSON файл"""
    output_dir = PROJECT_ROOT / EXTRACTION_CONFIG['output_dir']
    output_dir.mkdir(exist_ok=True)
    
    output_file = output_dir / f"{slug}.json"
    
    data = {
        'source': {
            'card_slug': slug,
            'url': url,
            'url_title': url_title,
            'extracted_at': datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        },
        'title': metadata.get('title', ''),
        'description': metadata.get('description', ''),
        'keywords': metadata.get('keywords', []),
        'author': metadata.get('author', ''),
        'author_meta': metadata.get('author_meta', []),
        'og_title': metadata.get('og_title', ''),
        'og_description': metadata.get('og_description', ''),
        'og_image': metadata.get('og_image', ''),
        'twitter_title': metadata.get('twitter_title', ''),
        'twitter_description': metadata.get('twitter_description', ''),
        'canonical': metadata.get('canonical', ''),
        'language': metadata.get('language', 'ru'),
        'seo_robots': metadata.get('seo_robots', ''),
        'seo_structured': seo_data.get('seo_structured', {}),
        'seo_breadcrumbs': seo_data.get('seo_breadcrumbs', []),
        'body_text': content.get('body_text', ''),
        'headings_h1': content.get('headings_h1', []),
        'headings_h2': content.get('headings_h2', []),
        'headings_h3': content.get('headings_h3', []),
        'headings_h4': content.get('headings_h4', []),
        'headings_h5': content.get('headings_h5', []),
        'headings_h6': content.get('headings_h6', []),
        'paragraphs': content.get('paragraphs', []),
        'links': content.get('links', []),
        'images': content.get('images', []),
        'stats': stats
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Сохранено: {output_file}")


def process_url(url_data: Dict[str, str]) -> bool:
    """Обрабатывает один URL"""
    slug = url_data['slug']
    url = url_data['url']
    url_title = url_data['url_title']
    
    logger.info(f"Обработка {slug}: {url}")
    
    try:
        render_mode = url_data.get("render_mode", "off")  # off | force | smart
        html_requests = None
        metadata = content = seo_data = stats = None

        # 1) requests (если не force)
        if render_mode != "force":
            html_requests = download_html(url)
            if html_requests:
                metadata, content, seo_data, stats = extract_from_html(html_requests)

        # 2) решаем, нужен ли рендер
        need_render = False
        if render_mode == "force":
            need_render = True
        elif render_mode == "smart":
            # если requests не дал HTML или дал слишком мало текста — пробуем Playwright
            if not html_requests:
                need_render = True
            elif stats is not None and should_smart_render(metadata or {}, stats):
                need_render = True

        if need_render:
            html_rendered = render_html_with_playwright(url)
            if html_rendered:
                m2, c2, s2, st2 = extract_from_html(html_rendered)
                # В smart режиме берем рендер только если он реально улучшил текст
                if render_mode == "smart" and stats is not None:
                    if int(st2.get("char_count", 0) or 0) >= int(stats.get("char_count", 0) or 0):
                        metadata, content, seo_data, stats = m2, c2, s2, st2
                else:
                    metadata, content, seo_data, stats = m2, c2, s2, st2
            else:
                if render_mode == "force":
                    logger.warning("Render не дал HTML, пробуем обычную загрузку requests.")
                    html_fallback = download_html(url)
                    if not html_fallback:
                        logger.error(f"Не удалось скачать {url}")
                        return False
                    metadata, content, seo_data, stats = extract_from_html(html_fallback)

        if metadata is None or content is None or seo_data is None or stats is None:
            logger.error(f"Не удалось скачать {url}")
            return False
        
        # Сохранение
        save_extracted_data(slug, url, url_title, metadata, content, seo_data, stats)
        
        return True
    except Exception as e:
        logger.error(f"Ошибка при обработке {url}: {e}")
        return False


def main():
    """Основная функция"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Извлечение данных с внешних сайтов')
    parser.add_argument('--limit', type=int, default=EXTRACTION_CONFIG.get('limit', 5),
                       help='Ограничение количества сайтов для обработки')
    parser.add_argument('--skip-existing', action='store_true',
                       help='Пропускать уже обработанные сайты')
    parser.add_argument('--render-js', action='store_true',
                       help='Всегда рендерить страницу в headless-браузере (медленнее, но нужно для SPA/страниц с JS)')
    parser.add_argument('--smart-render', action='store_true',
                       help='Сначала requests, а Playwright только если контент пустой/короткий (быстрее)')
    
    args = parser.parse_args()
    if args.render_js and args.smart_render:
        parser.error("Нельзя использовать одновременно --render-js и --smart-render")
    
    logger.info("=" * 60)
    logger.info("Начало извлечения данных с сайтов")
    logger.info(f"Лимит: {args.limit}")
    logger.info(f"Пропуск существующих: {args.skip_existing}")
    logger.info("=" * 60)
    
    # Получение URL из БД
    urls = get_urls_from_db(limit=args.limit, skip_existing=args.skip_existing)
    render_mode = "off"
    if args.render_js:
        render_mode = "force"
    elif args.smart_render:
        render_mode = "smart"
    if render_mode != "off":
        for u in urls:
            u["render_mode"] = render_mode
    
    if not urls:
        logger.warning("Не найдено URL для обработки")
        return
    
    logger.info(f"Найдено URL для обработки: {len(urls)}")
    
    # Обработка
    success_count = 0
    error_count = 0
    start_time = time.time()
    
    for i, url_data in enumerate(urls, 1):
        logger.info(f"\n[{i}/{len(urls)}] Обработка {url_data['slug']}")
        
        if process_url(url_data):
            success_count += 1
        else:
            error_count += 1
        
        # Задержка между запросами
        if i < len(urls):
            time.sleep(EXTRACTION_CONFIG.get('delay_between_requests', 2))
    
    # Статистика
    elapsed_time = time.time() - start_time
    logger.info("\n" + "=" * 60)
    logger.info("Завершено")
    logger.info(f"Успешно: {success_count}")
    logger.info(f"Ошибок: {error_count}")
    logger.info(f"Время: {elapsed_time:.2f} сек")
    logger.info("=" * 60)
    
    # Сохранение общей статистики
    stats_file = LOG_DIR / 'stats.json'
    stats_data = {
        'total': len(urls),
        'success': success_count,
        'errors': error_count,
        'elapsed_time_seconds': round(elapsed_time, 2),
        'timestamp': datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    }
    with open(stats_file, 'w', encoding='utf-8') as f:
        json.dump(stats_data, f, ensure_ascii=False, indent=2)
    close_playwright()


if __name__ == '__main__':
    main()

