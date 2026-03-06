<?php
/**
 * Скрипт для обработки красивых SEO URL карточек
 * Отдает detail.html напрямую, без редиректа.
 *
 * Критично для SEO (Яндекс/Google):
 * - без JS разные /card/... страницы выглядели одинаково (дубли/soft-404)
 * - здесь мы подставляем уникальные meta (title/description/canonical/og) и минимальный HTML-контент
 * - JS по-прежнему догружает и отображает “живую” страницу
 */

require_once __DIR__ . '/api/config.php';

function e($value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function buildSiteBaseUrl(): string {
    $host = $_SERVER['HTTP_HOST'] ?? 'bibliotechka.online';
    $hostNoPort = explode(':', $host, 2)[0];
    // Пытаемся определить схему корректно (локально часто http),
    // но для продакшена SEO-каноникал предпочитаем https.
    $forwardedProto = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? null;
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($forwardedProto === 'https');
    $scheme = $isHttps ? 'https' : 'http';
    if (!in_array($hostNoPort, ['localhost', '127.0.0.1'], true)) {
        $scheme = 'https';
    }
    return $scheme . '://' . $host;
}

function buildCardCanonicalUrl(string $urlSeoYandex): string {
    return buildSiteBaseUrl() . '/card/' . rawurlencode($urlSeoYandex);
}

function firstNonEmpty(...$values): ?string {
    foreach ($values as $v) {
        if (is_string($v)) {
            $t = trim($v);
            if ($t !== '') return $t;
        }
    }
    return null;
}

function buildSeoHeadHtml(array $card, string $canonicalUrl): string {
    $title = firstNonEmpty($card['title'] ?? null, 'Библиотечка');
    $description = firstNonEmpty($card['description'] ?? null, 'Материал из Библиотечки.');
    $image = firstNonEmpty(
        $card['cover_large'] ?? null,
        $card['cover_short'] ?? null,
        $card['cover'] ?? null
    );

    $titleEsc = e($title);
    $descEsc = e($description);
    $canonEsc = e($canonicalUrl);
    $imageEsc = $image ? e($image) : null;

    // OG-теги
    $tags  = "\n    " . '<meta property="og:site_name" content="Библиотечка">';
    $tags .= "\n    " . '<meta property="og:type" content="article">';
    $tags .= "\n    " . '<meta property="og:title" content="' . $titleEsc . '">';
    $tags .= "\n    " . '<meta property="og:description" content="' . $descEsc . '">';
    $tags .= "\n    " . '<meta property="og:url" content="' . $canonEsc . '">';
    $tags .= "\n    " . '<meta property="og:locale" content="ru_RU">';
    if ($imageEsc) {
        $tags .= "\n    " . '<meta property="og:image" content="' . $imageEsc . '">';
    }

    // Twitter card
    $tags .= "\n    " . '<meta name="twitter:card" content="summary_large_image">';
    $tags .= "\n    " . '<meta name="twitter:site" content="@bibliotechka">';
    $tags .= "\n    " . '<meta name="twitter:title" content="' . $titleEsc . '">';
    $tags .= "\n    " . '<meta name="twitter:description" content="' . $descEsc . '">';
    if ($imageEsc) {
        $tags .= "\n    " . '<meta name="twitter:image" content="' . $imageEsc . '">';
    }

    // hreflang
    $tags .= "\n    " . '<link rel="alternate" hreflang="ru" href="' . $canonEsc . '">';
    $tags .= "\n    " . '<link rel="alternate" hreflang="x-default" href="' . $canonEsc . '">';

    // Schema.org Article
    $datePublished = '';
    if (!empty($card['published'])) {
        $ts = strtotime((string)$card['published']);
        if ($ts) $datePublished = date('Y-m-d', $ts);
    }
    $dateModified = '';
    if (!empty($card['updated_at'])) {
        $ts = strtotime((string)$card['updated_at']);
        if ($ts) $dateModified = date('Y-m-dTH:i:sP', $ts);
    }

    $schema = [
        '@context' => 'https://schema.org',
        '@type'    => 'Article',
        'headline' => $title,
        'url'      => $canonicalUrl,
        'description' => $description,
    ];
    if ($imageEsc) {
        $schema['image'] = $image;
    }
    if ($datePublished) {
        $schema['datePublished'] = $datePublished;
    }
    if ($dateModified) {
        $schema['dateModified'] = $dateModified;
    }
    $schema['publisher'] = [
        '@type' => 'Organization',
        'name'  => 'Библиотечка',
        'url'   => 'https://bibliotechka.online',
    ];

    $tags .= "\n    " . '<script type="application/ld+json">'
          . "\n    " . json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT)
          . "\n    " . '</script>';

    $tags .= "\n";
    return $tags;
}

function buildSsrContentHtml(array $card, string $canonicalUrl): string {
    $title = firstNonEmpty($card['title'] ?? null, 'Библиотечка');
    $description = firstNonEmpty($card['description'] ?? null, '');
    $image = firstNonEmpty(
        $card['cover_large'] ?? null,
        $card['cover_short'] ?? null,
        $card['cover'] ?? null
    );

    $html = '<div id="ssr-content" class="wrap-center" style="padding: 16px 16px 0;">';
    $html .= '<h1 style="margin: 0 0 8px; font-size: 24px; line-height: 1.2;">' . e($title) . '</h1>';
    if ($description !== '') {
        $html .= '<p style="margin: 0 0 12px; opacity: .85;">' . e($description) . '</p>';
    }
    if ($image) {
        $html .= '<p style="margin: 0 0 12px;">'
              .  '<img src="' . e($image) . '" alt="' . e($title) . '" style="max-width:100%;height:auto;border-radius:12px;">'
              .  '</p>';
    }

    // Выводим ссылки (если есть) — это делает контент страницы уникальным даже без JS.
    $links = [];
    for ($i = 1; $i <= 6; $i++) {
        $u = trim((string)($card["url_$i"] ?? ''));
        if ($u === '') continue;
        $t = trim((string)($card["url_title_$i"] ?? ''));
        $links[] = ['url' => $u, 'title' => ($t !== '' ? $t : $u)];
    }
    if (!empty($links)) {
        $html .= '<ul style="margin: 0 0 12px; padding-left: 18px;">';
        foreach ($links as $l) {
            $html .= '<li><a href="' . e($l['url']) . '" rel="noopener noreferrer" target="_blank">' . e($l['title']) . '</a></li>';
        }
        $html .= '</ul>';
    }

    $html .= '<p style="margin: 0 0 12px;"><a href="' . e($canonicalUrl) . '">' . e($canonicalUrl) . '</a></p>';
    $html .= '</div>';
    return $html;
}

$urlSeoYandex = $_GET['url_seo_yandex'] ?? null;
if (!$urlSeoYandex || !is_string($urlSeoYandex) || !preg_match('/^[a-z0-9-]+$/', $urlSeoYandex)) {
    http_response_code(400);
    header('Content-Type: text/html; charset=utf-8');
    echo '<h1>Bad request</h1>';
    exit;
}

$detailFile = __DIR__ . '/detail.html';
if (!file_exists($detailFile)) {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    echo '<h1>Страница не найдена</h1>';
    exit;
}

// Грузим карточку из БД по url_seo_yandex
$db = getDBConnection();
$stmt = $db->prepare('SELECT * FROM data WHERE url_seo_yandex = ? LIMIT 1');
$stmt->execute([$urlSeoYandex]);
$card = $stmt->fetch();

if (!$card) {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    echo '<h1>Материал не найден</h1>';
    exit;
}

header('Content-Type: text/html; charset=utf-8');
$canonicalUrl = buildCardCanonicalUrl($urlSeoYandex);

// Читаем detail.html и внедряем SEO
$content = file_get_contents($detailFile);

// Добавляем <base> для корректных относительных путей при /card/...
if (strpos($content, '<base') === false) {
    $content = preg_replace('/(<head[^>]*>)/i', '$1' . "\n    " . '<base href="/">', $content, 1);
}

// Подставляем SEO-meta в <head>
$seoHead = buildSeoHeadHtml($card, $canonicalUrl);

// 1) Заменяем title если уже есть, иначе вставляем после <head>
if (preg_match('/<title>.*?<\/title>/is', $content)) {
    $content = preg_replace('/<title>.*?<\/title>/is', "    <title>" . e(firstNonEmpty($card['title'] ?? null, 'Библиотечка')) . "</title>", $content, 1);
} else {
    $content = preg_replace('/(<head[^>]*>)/i', '$1' . "\n    " . '<title>' . e(firstNonEmpty($card['title'] ?? null, 'Библиотечка')) . '</title>', $content, 1);
}

// 2) description
if (preg_match('/<meta\\s+name=[\"\']description[\"\'][^>]*>/i', $content)) {
    $content = preg_replace(
        '/<meta\\s+name=[\"\']description[\"\'][^>]*>/i',
        '    <meta name="description" content="' . e(firstNonEmpty($card['description'] ?? null, 'Материал из Библиотечки.')) . '">',
        $content,
        1
    );
} else {
    $content = preg_replace('/(<head[^>]*>)/i', '$1' . "\n    " . '<meta name="description" content="' . e(firstNonEmpty($card['description'] ?? null, 'Материал из Библиотечки.')) . '">', $content, 1);
}

// 3) canonical
if (preg_match('/<link\\s+rel=[\"\']canonical[\"\'][^>]*>/i', $content)) {
    $content = preg_replace(
        '/<link\\s+rel=[\"\']canonical[\"\'][^>]*>/i',
        '    <link rel="canonical" href="' . e($canonicalUrl) . '">',
        $content,
        1
    );
} else {
    $content = preg_replace('/(<head[^>]*>)/i', '$1' . "\n    " . '<link rel="canonical" href="' . e($canonicalUrl) . '">', $content, 1);
}

// Добавляем OG meta (простая вставка перед закрывающим </head>, чтобы не плодить дубли выше)
if (stripos($content, 'property="og:title"') === false) {
    $content = preg_replace('/<\/head>/i', $seoHead . "\n</head>", $content, 1);
}

// Убираем устаревшие meta Cache-Control из HTML-шаблона
$content = preg_replace('/<meta\s+http-equiv=["\']Cache-Control["\'][^>]*>\s*/i', '', $content);
$content = preg_replace('/<meta\s+http-equiv=["\']Pragma["\'][^>]*>\s*/i', '', $content);
$content = preg_replace('/<meta\s+http-equiv=["\']Expires["\'][^>]*>\s*/i', '', $content);

// Вставляем SSR-блок в начало <body> — он будет скрыт для JS-браузеров (см. detail.html)
$ssr = buildSsrContentHtml($card, $canonicalUrl);
if (strpos($content, 'id="ssr-content"') === false) {
    $content = preg_replace('/(<body[^>]*>)/i', '$1' . "\n    " . $ssr, $content, 1);
}

echo $content;
exit;

