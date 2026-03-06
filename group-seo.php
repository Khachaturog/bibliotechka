<?php
/**
 * SSR страница группы: /{slug}
 * - Уникальные meta/canonical/OG для каждой группы
 * - SSR-блок с карточками (виден поисковикам, скрыт при JS)
 * - Файловый кэш 30 минут
 */

require_once __DIR__ . '/api/config.php';

function groupE(string|int|float|null $value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function groupBuildBaseUrl(): string {
    $host = $_SERVER['HTTP_HOST'] ?? 'bibliotechka.online';
    $fwdProto = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? null;
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $fwdProto === 'https';
    $scheme = $isHttps ? 'https' : 'http';
    $hostNoPort = explode(':', $host, 2)[0];
    if (!in_array($hostNoPort, ['localhost', '127.0.0.1'], true)) {
        $scheme = 'https';
    }
    return $scheme . '://' . $host;
}

// ─── Параметр slug ────────────────────────────────────────────────────────────
$slug = $_GET['slug'] ?? null;
if (!$slug || !is_string($slug) || !preg_match('/^[a-z0-9-]+$/', $slug)) {
    http_response_code(404);
    $notFound = __DIR__ . '/404.html';
    if (file_exists($notFound)) { header('Content-Type: text/html; charset=utf-8'); readfile($notFound); exit; }
    header('Content-Type: text/html; charset=utf-8');
    echo '<h1>Страница не найдена</h1>';
    exit;
}

// ─── Файловый кэш (TTL 30 минут) ─────────────────────────────────────────────
$cacheFile = __DIR__ . '/cache/group-' . preg_replace('/[^a-z0-9-]/', '', $slug) . '.html';
$cacheTtl  = 1800;

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
    header('Content-Type: text/html; charset=utf-8');
    header('X-Cache: HIT');
    readfile($cacheFile);
    exit;
}

// ─── Данные из БД ─────────────────────────────────────────────────────────────
$db = getDBConnection();

$stmtGroup = $db->prepare(
    "SELECT slug, title_ru, description_ru, cover FROM `groups` WHERE slug = ? LIMIT 1"
);
$stmtGroup->execute([$slug]);
$group = $stmtGroup->fetch();

if (!$group) {
    http_response_code(404);
    $notFound = __DIR__ . '/404.html';
    if (file_exists($notFound)) { header('Content-Type: text/html; charset=utf-8'); readfile($notFound); exit; }
    header('Content-Type: text/html; charset=utf-8');
    echo '<h1>Группа не найдена</h1>';
    exit;
}

$stmtCards = $db->prepare(
    "SELECT slug, url_seo_yandex, title, description, cover_short
     FROM data WHERE group_slug = ? AND status_slug = 'published' ORDER BY slug"
);
$stmtCards->execute([$slug]);
$cards = $stmtCards->fetchAll();

$groupFile = __DIR__ . '/group.html';
if (!file_exists($groupFile)) {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    echo '<h1>Страница не найдена</h1>';
    exit;
}

// ─── Формируем SEO данные ──────────────────────────────────────────────────────
$baseUrl      = groupBuildBaseUrl();
$canonicalUrl = $baseUrl . '/' . rawurlencode($slug);
$title        = trim($group['title_ru'] ?? '');
$description  = trim($group['description_ru'] ?? '');
$cover        = trim($group['cover'] ?? '');
$cardCount    = count($cards);

$pageTitle = $title ? $title . ' — Библиотечка' : 'Библиотечка';
$pageDesc  = $description
    ? $description . ' (' . $cardCount . ' материалов)'
    : 'Раздел «' . $title . '» — ' . $cardCount . ' материалов на Библиотечке.';

// ─── Читаем group.html и внедряем SEO ────────────────────────────────────────
$content = file_get_contents($groupFile);

// base href для корректных относительных путей
if (strpos($content, '<base') === false) {
    $content = preg_replace('/(<head[^>]*>)/i', '$1' . "\n    " . '<base href="/">', $content, 1);
}

// title
if (preg_match('/<title>.*?<\/title>/is', $content)) {
    $content = preg_replace('/<title>.*?<\/title>/is', '<title>' . groupE($pageTitle) . '</title>', $content, 1);
} else {
    $content = preg_replace('/(<head[^>]*>)/i', '$1' . "\n    <title>" . groupE($pageTitle) . '</title>', $content, 1);
}

// description
$descTag = '<meta name="description" content="' . groupE($pageDesc) . '">';
if (preg_match('/<meta\s+name=["\']description["\'][^>]*>/i', $content)) {
    $content = preg_replace('/<meta\s+name=["\']description["\'][^>]*>/i', $descTag, $content, 1);
} else {
    $content = preg_replace('/(<head[^>]*>)/i', '$1' . "\n    " . $descTag, $content, 1);
}

// canonical
$canonTag = '<link rel="canonical" href="' . groupE($canonicalUrl) . '">';
if (preg_match('/<link\s+rel=["\']canonical["\'][^>]*>/i', $content)) {
    $content = preg_replace('/<link\s+rel=["\']canonical["\'][^>]*>/i', $canonTag, $content, 1);
} else {
    $content = preg_replace('/(<head[^>]*>)/i', '$1' . "\n    " . $canonTag, $content, 1);
}

// OG-теги
if (stripos($content, 'property="og:title"') === false) {
    $ogTags  = "\n    " . '<meta property="og:type" content="website">';
    $ogTags .= "\n    " . '<meta property="og:title" content="' . groupE($pageTitle) . '">';
    $ogTags .= "\n    " . '<meta property="og:description" content="' . groupE($pageDesc) . '">';
    $ogTags .= "\n    " . '<meta property="og:url" content="' . groupE($canonicalUrl) . '">';
    if ($cover) {
        $ogTags .= "\n    " . '<meta property="og:image" content="' . groupE($cover) . '">';
    }
    $ogTags .= "\n    " . '<meta property="og:locale" content="ru_RU">';
    $content = preg_replace('/<\/head>/i', $ogTags . "\n</head>", $content, 1);
}

// Убираем meta Cache-Control из group.html
$content = preg_replace('/<meta\s+http-equiv=["\']Cache-Control["\'][^>]*>\s*/i', '', $content);
$content = preg_replace('/<meta\s+http-equiv=["\']Pragma["\'][^>]*>\s*/i', '', $content);
$content = preg_replace('/<meta\s+http-equiv=["\']Expires["\'][^>]*>\s*/i', '', $content);

// ─── SSR-блок с карточками ────────────────────────────────────────────────────
$ssrCards = '<div id="ssr-content" style="display:none">';
$ssrCards .= '<h1 style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">' . groupE($title) . '</h1>';
$ssrCards .= '<p style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">' . groupE($description) . '</p>';
foreach ($cards as $card) {
    $cardUrl = '/card/' . rawurlencode((string)($card['url_seo_yandex'] ?? ''));
    $ssrCards .= '<a href="' . groupE($cardUrl) . '">';
    if (!empty($card['cover_short'])) {
        $ssrCards .= '<img src="' . groupE($card['cover_short']) . '" alt="' . groupE($card['title']) . '" loading="lazy">';
    }
    $ssrCards .= groupE($card['title']);
    if (!empty($card['description'])) {
        $ssrCards .= ' — ' . groupE($card['description']);
    }
    $ssrCards .= '</a>';
}
$ssrCards .= '</div>';

// Вставляем SSR-блок в начало body
// Стиль display:none для браузеров — контент семантически читается поисковиком
// Яндекс индексирует скрытый контент, если он полезный и не спамный
$content = preg_replace('/(<body[^>]*>)/i', '$1' . "\n    " . $ssrCards, $content, 1);

// Скрипт добавления класса js для скрытия SSR-блока не нужен,
// т.к. SSR-блок уже скрыт через display:none для пользователей,
// а поисковик читает его как текстовый контент.

// ─── Кэш и отдача ─────────────────────────────────────────────────────────────
$cacheDir = __DIR__ . '/cache';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}
@file_put_contents($cacheFile, $content);

header('Content-Type: text/html; charset=utf-8');
header('X-Cache: MISS');
echo $content;
exit;
