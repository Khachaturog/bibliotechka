<?php
/**
 * SSR страница карточки: /card/{url_seo_yandex}
 * - Уникальные meta/canonical/OG для каждой карточки
 * - SSR-блок с контентом (виден поисковикам, скрыт при JS)
 * - JS по-прежнему догружает и отображает "живую" страницу
 */

require_once __DIR__ . '/api/config.php';

function e($value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
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

function buildCardCanonicalUrl(string $urlSeoYandex): string {
    return SITE_BASE_URL . '/card/' . rawurlencode($urlSeoYandex);
}

// ─── Параметр url_seo_yandex ──────────────────────────────────────────────────
$urlSeoYandex = $_GET['url_seo_yandex'] ?? null;
if (!$urlSeoYandex || !is_string($urlSeoYandex) || !preg_match('/^[a-z0-9-]+$/', $urlSeoYandex)) {
    http_response_code(400);
    header('Content-Type: text/html; charset=utf-8');
    echo '<h1>Bad request</h1>';
    exit;
}

// ─── Файловый кэш (TTL 24 часа) ──────────────────────────────────────────────
$cacheFile = __DIR__ . '/cache/card-' . preg_replace('/[^a-z0-9-]/', '', $urlSeoYandex) . '.html';
$cacheTtl  = 86400;

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
    header('Content-Type: text/html; charset=utf-8');
    header('X-Cache: HIT');
    readfile($cacheFile);
    exit;
}

// ─── Данные из БД ─────────────────────────────────────────────────────────────
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

// ─── SEO-данные ───────────────────────────────────────────────────────────────
$canonicalUrl = buildCardCanonicalUrl($urlSeoYandex);
$cardTitle    = firstNonEmpty($card['title'] ?? null, 'Библиотечка');
$cardDesc     = firstNonEmpty($card['description'] ?? null, 'Материал из Библиотечки.');
$cardImage    = firstNonEmpty(
    $card['cover_large'] ?? null,
    $card['cover_short'] ?? null,
    $card['cover'] ?? null
);
$cardImageAbs = $cardImage ? absoluteUrl($cardImage) : null;

// Schema.org даты
$datePublished = '';
if (!empty($card['published'])) {
    $ts = strtotime((string)$card['published']);
    if ($ts) $datePublished = date('Y-m-d', $ts);
}
$dateModified = '';
if (!empty($card['updated_at'])) {
    $ts = strtotime((string)$card['updated_at']);
    if ($ts) $dateModified = date('Y-m-d\TH:i:sP', $ts);
}

$schema = [
    '@context'    => 'https://schema.org',
    '@type'       => 'Article',
    'headline'    => $cardTitle,
    'url'         => $canonicalUrl,
    'description' => $cardDesc,
];
if ($cardImageAbs) {
    $schema['image'] = $cardImageAbs;
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
    'url'   => SITE_BASE_URL,
];

// SSR-ссылки для уникальности контента
$ssrLinks = [];
for ($i = 1; $i <= 6; $i++) {
    $u = trim((string)($card["url_$i"] ?? ''));
    if ($u === '') continue;
    $t = trim((string)($card["url_title_$i"] ?? ''));
    $ssrLinks[] = ['url' => $u, 'title' => ($t !== '' ? $t : $u)];
}

// ─── Авторы (для SSR) ─────────────────────────────────────────────────────────
$stmtAuthors = $db->prepare("
    SELECT a.title_ru, a.title_en, a.slug
    FROM authors a
    INNER JOIN card_authors ca ON a.slug = ca.author_slug
    WHERE ca.card_slug = ?
    ORDER BY a.title_ru
");
$stmtAuthors->execute([$card['slug']]);
$ssrAuthors = $stmtAuthors->fetchAll();

// ─── Генерация HTML ───────────────────────────────────────────────────────────
ob_start();
?>
<!DOCTYPE html>
<html lang="ru">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="/">
    <title><?= e($cardTitle) ?></title>
    <meta name="description" content="<?= e($cardDesc) ?>">
    <link rel="canonical" href="<?= e($canonicalUrl) ?>">

    <!-- Hide server-rendered SEO block when JS is enabled -->
    <script>document.documentElement.classList.add('js');</script>
    <style>html.js #ssr-content { display: none !important; }</style>

    <link rel="icon" href="/images/favicon.svg" type="image/svg+xml">

    <!-- Принудительное использование HTTPS для всех запросов -->
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">

    <meta property="og:site_name" content="Библиотечка">
    <meta property="og:type" content="article">
    <meta property="og:title" content="<?= e($cardTitle) ?>">
    <meta property="og:description" content="<?= e($cardDesc) ?>">
    <meta property="og:url" content="<?= e($canonicalUrl) ?>">
    <meta property="og:locale" content="ru_RU">
    <?php if ($cardImageAbs): ?>
    <meta property="og:image" content="<?= e($cardImageAbs) ?>">
    <?php endif; ?>

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@bibliotechka">
    <meta name="twitter:title" content="<?= e($cardTitle) ?>">
    <meta name="twitter:description" content="<?= e($cardDesc) ?>">
    <?php if ($cardImageAbs): ?>
    <meta name="twitter:image" content="<?= e($cardImageAbs) ?>">
    <?php endif; ?>

    <link rel="alternate" hreflang="ru" href="<?= e($canonicalUrl) ?>">
    <link rel="alternate" hreflang="x-default" href="<?= e($canonicalUrl) ?>">

    <script type="application/ld+json">
    <?= json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) ?>
    </script>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap">

    <link rel="stylesheet" href="/css/base.css">

    <meta name="theme-color" content="#FFFFFF">

    <meta name="robots" content="index, follow">
    <!-- SEO -->
    <meta name="yandex-verification" content="9e48f4959071c524" />
    <!-- Yandex.Metrika counter -->
    <script type="text/javascript">
        (function (m, e, t, r, i, k, a) {
            m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
            m[i].l = 1 * new Date();
            for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
            k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
        })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

        ym(101553574, 'init', { webvisor: true, clickmap: true, accurateTrackBounce: true, trackLinks: true });
    </script>
    <noscript>
        <div><img src="https://mc.yandex.ru/watch/101553574" style="position:absolute; left:-9999px;" alt="" /></div>
    </noscript>
    <!-- /Yandex.Metrika counter -->
</head>

<body style="max-width: 768px;">

    <!-- SSR-блок: виден поисковым роботам, скрыт при работе JS (html.js #ssr-content) -->
    <div id="ssr-content" class="wrap-center" style="padding: 16px 16px 0;">
        <h1 style="margin: 0 0 8px; font-size: 24px; line-height: 1.2;"><?= e($cardTitle) ?></h1>
        <?php if ($cardDesc): ?>
        <p style="margin: 0 0 12px; opacity: .85;"><?= e($cardDesc) ?></p>
        <?php endif; ?>
        <?php if ($cardImage): ?>
        <p style="margin: 0 0 12px;">
            <img src="<?= e($cardImage) ?>" alt="<?= e($cardTitle) ?>" style="max-width:100%;height:auto;border-radius:12px;">
        </p>
        <?php endif; ?>
        <?php if (!empty($ssrLinks)): ?>
        <ul style="margin: 0 0 12px; padding-left: 18px;">
            <?php foreach ($ssrLinks as $l): ?>
            <li><a href="<?= e($l['url']) ?>" rel="noopener noreferrer" target="_blank"><?= e($l['title']) ?></a></li>
            <?php endforeach; ?>
        </ul>
        <?php endif; ?>
        <?php if (!empty($ssrAuthors)): ?>
        <p style="margin: 0 0 8px;"><strong>Автор:</strong>
            <?= e(implode(', ', array_map(fn($a) => $a['title_ru'] ?: $a['title_en'] ?: $a['slug'], $ssrAuthors))) ?>
        </p>
        <?php endif; ?>
        <?php if (!empty($card['summary_ai'])): ?>
        <p style="margin: 0 0 8px;"><?= e($card['summary_ai']) ?></p>
        <?php endif; ?>
        <?php if (!empty($card['detail'])): ?>
        <p style="margin: 0 0 8px;"><strong>Теги:</strong> <?= e($card['detail']) ?></p>
        <?php endif; ?>
        <?php if (!empty($card['group_slug'])): ?>
        <p style="margin: 0 0 4px;"><strong>Раздел:</strong> <a href="/<?= e($card['group_slug']) ?>"><?= e($card['group_slug']) ?></a></p>
        <?php endif; ?>
        <?php if (!empty($card['subgroup_slug'])): ?>
        <p style="margin: 0 0 8px;"><strong>Категория:</strong> <?= e($card['subgroup_slug']) ?></p>
        <?php endif; ?>
        <?php if (!empty($card['published'])): ?>
        <p style="margin: 0 0 4px;"><strong>Опубликовано:</strong> <?= e($card['published']) ?></p>
        <?php endif; ?>
        <?php if (!empty($card['start_date']) || !empty($card['end_date'])): ?>
        <p style="margin: 0 0 4px;"><strong>Период:</strong> <?= e($card['start_date'] ?? '-') ?> — <?= e($card['end_date'] ?? '-') ?></p>
        <?php endif; ?>
        <?php if (!empty($card['version_slug'])): ?>
        <p style="margin: 0 0 8px;"><strong>Версия:</strong> <?= e($card['version_slug']) ?></p>
        <?php endif; ?>
        <p style="margin: 0 0 12px;"><a href="<?= e($canonicalUrl) ?>"><?= e($canonicalUrl) ?></a></p>
    </div>

    <section class="wrap-start">
        <?php include __DIR__ . '/partials/header.php'; ?>
    </section>

    <div class="wrap-center detail-container-actions">
        <button class="secondary-sm" onclick="navigateToSubgroupFromBreadcrumb()" aria-label="Вернуться назад">
            <span class="icon-schevron-left">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M6.25 10.0094C6.25 9.77618 6.34628 9.56234 6.50032 9.38743L12.2577 3.5954C12.6043 3.24554 13.1434 3.24554 13.4901 3.5954C13.8367 3.94525 13.8367 4.48947 13.4901 4.83933L8.32959 10.0094L13.4708 15.16C13.8174 15.5098 13.8174 16.0541 13.4708 16.4039C13.1242 16.7538 12.5851 16.7538 12.2384 16.4039L6.48107 10.6313C6.32702 10.4758 6.25 10.2426 6.25 10.0094Z"/>
                </svg>
            </span>
        </button>
        <button class="secondary-sm" onclick="getRandomCardRedirect()" aria-label="Открыть случайную карточку">
            <span class="icon-random">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M15.5908 11.9123C15.2658 11.5856 14.7375 11.5839 14.4125 11.9098C14.0858 12.2348 14.0842 12.7623 14.4092 13.0881L14.6533 13.3339H13.3333C11.495 13.3339 10 11.8381 10 10.0006C10 8.16228 11.495 6.66728 13.3333 6.66728H14.6567L14.4125 6.90978C14.0858 7.23478 14.0842 7.76228 14.4092 8.08812C14.5717 8.25145 14.7858 8.33395 15 8.33395C15.2125 8.33395 15.4258 8.25228 15.5875 8.09061L17.2542 6.43145C17.4117 6.27561 17.4992 6.06395 17.5 5.84311C17.5008 5.62145 17.4133 5.40978 17.2575 5.25311L15.5908 3.57895C15.2658 3.25228 14.7375 3.25061 14.4125 3.57645C14.0858 3.90145 14.0842 4.42895 14.4092 4.75478L14.6533 5.00061H13.3333C11.595 5.00061 10.0625 5.89228 9.16667 7.24228C8.27083 5.89228 6.73833 5.00061 5 5.00061H3.33333C2.8725 5.00061 2.5 5.37311 2.5 5.83395C2.5 6.29395 2.8725 6.66728 3.33333 6.66728H5C6.83833 6.66728 8.33333 8.16228 8.33333 10.0006C8.33333 11.8381 6.83833 13.3339 5 13.3339H3.33333C2.8725 13.3339 2.5 13.7064 2.5 14.1673C2.5 14.6273 2.8725 15.0006 3.33333 15.0006H5C6.73833 15.0006 8.27083 14.1081 9.16667 12.7581C10.0625 14.1081 11.595 15.0006 13.3333 15.0006H14.6567L14.4125 15.2431C14.0858 15.5681 14.0842 16.0956 14.4092 16.4214C14.5717 16.5848 14.7858 16.6673 15 16.6673C15.2125 16.6673 15.4258 16.5856 15.5875 16.4239L17.2542 14.7648C17.4117 14.6089 17.4992 14.3973 17.5 14.1764C17.5008 13.9548 17.4133 13.7431 17.2575 13.5864L15.5908 11.9123Z"/>
                </svg>
            </span>
        </button>
        <button class="secondary-sm" onclick="shareCard()" aria-label="Назад">
            <span class="icon-share">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.67859 1.72729C9.58642 1.76575 9.49984 1.82149 9.42359 1.89452C9.41875 1.89915 9.414 1.90384 9.40925 1.90859L6.90964 4.4082C6.58421 4.73364 6.58421 5.26128 6.90964 5.58671C7.23509 5.91215 7.76272 5.91215 8.08816 5.58671L9.16659 4.50826V12.5006C9.16659 12.9608 9.53967 13.3339 9.99992 13.3339C10.4602 13.3339 10.8333 12.9608 10.8333 12.5006V4.50825L11.9118 5.58671C12.2372 5.91215 12.7648 5.91215 13.0903 5.58671C13.4157 5.26128 13.4157 4.73364 13.0903 4.4082L10.5892 1.90716C10.4265 1.74444 10.2132 1.66308 9.99992 1.66309C9.88609 1.66309 9.7775 1.68593 9.67859 1.72729ZM14.1673 6.66517H14.1683C15.5494 6.66517 16.669 7.78477 16.669 9.1659V15.8353C16.669 17.2164 15.5494 18.336 14.1683 18.336H5.8315C4.45041 18.336 3.33081 17.2164 3.33081 15.8353V9.1659C3.33081 7.78477 4.45041 6.66517 5.8315 6.66517H5.83254L6.66763 6.66621C7.12786 6.66679 7.50049 7.04034 7.49992 7.50059C7.49934 7.96082 7.12579 8.33349 6.66554 8.33288L5.8315 8.33184C5.37109 8.33207 4.99748 8.7054 4.99748 9.1659V15.8353C4.99748 16.2959 5.37089 16.6693 5.8315 16.6693H14.1683C14.6289 16.6693 15.0023 16.2959 15.0023 15.8353V9.1659C15.0023 8.7054 14.6292 8.33207 14.1688 8.33184L13.3343 8.33288C12.8741 8.33349 12.5005 7.96082 12.4999 7.50059C12.4993 7.04034 12.872 6.66679 13.3323 6.66621L14.1673 6.66517Z"/>
                </svg>
            </span>
        </button>
    </div>

    <div id="detail-container-0">

        <div class="wrap-center" id="detail-image-placeholder">
            <div class="detail-container-image"></div>
        </div>
        
        <div class="wrap-center" id="detail-breadcrumb-placeholder">
            <div class="detail-skeleton-breadcrumb-row">
                <span class="skeleton skeleton-detail-icon"></span>
                
                <span class="icon-schevron-right">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6.82135 4.68218L9.66675 8.00032L6.82135 11.3184C6.58536 11.5809 6.62402 11.9715 6.90668 12.1901C7.03135 12.2866 7.18268 12.3337 7.33335 12.3337C7.52402 12.3337 7.71335 12.2575 7.84535 12.1108L11.1787 8.39646C11.2047 8.36739 11.2181 8.33332 11.2374 8.30112C11.2534 8.27512 11.2727 8.25286 11.2847 8.22439C11.3147 8.15319 11.3327 8.07832 11.3327 8.00279L11.3334 8.00032L11.3327 7.99779C11.3327 7.92232 11.3147 7.84739 11.2847 7.77619C11.2727 7.74772 11.2534 7.72546 11.2374 7.69946C11.2181 7.66726 11.2047 7.63319 11.1787 7.60412L7.84535 3.88979C7.61002 3.62732 7.19002 3.59141 6.90668 3.81056C6.62402 4.02908 6.58536 4.4197 6.82135 4.68218Z"/>
                    </svg>
                </span>

                <span class="skeleton skeleton-detail-chip"></span>
                
                <span class="icon-schevron-right">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6.82135 4.68218L9.66675 8.00032L6.82135 11.3184C6.58536 11.5809 6.62402 11.9715 6.90668 12.1901C7.03135 12.2866 7.18268 12.3337 7.33335 12.3337C7.52402 12.3337 7.71335 12.2575 7.84535 12.1108L11.1787 8.39646C11.2047 8.36739 11.2181 8.33332 11.2374 8.30112C11.2534 8.27512 11.2727 8.25286 11.2847 8.22439C11.3147 8.15319 11.3327 8.07832 11.3327 8.00279L11.3334 8.00032L11.3327 7.99779C11.3327 7.92232 11.3147 7.84739 11.2847 7.77619C11.2727 7.74772 11.2534 7.72546 11.2374 7.69946C11.2181 7.66726 11.2047 7.63319 11.1787 7.60412L7.84535 3.88979C7.61002 3.62732 7.19002 3.59141 6.90668 3.81056C6.62402 4.02908 6.58536 4.4197 6.82135 4.68218Z"/>
                    </svg>
                </span>

                <span class="skeleton skeleton-detail-chip skeleton-detail-chip--wide"></span>
            </div>
        </div>
        <div class="wrap-center" id="detail-title-placeholder">
            <div class="detail-skeleton-title-wrap">
                <span class="skeleton skeleton-detail-title"></span>
                <span class="skeleton skeleton-detail-subtitle"></span>
            </div>
        </div>
        <template id="detail-template">
            <div class="detail-container">

                <div class="wrap-center">
                    <div class="detail-container-image">
                        <img class="image" src="" alt="">
                    </div>
                </div>
                
                <div class="wrap-center">
                    <div style="display: flex; align-items: center; gap: 4px; align-self: stretch;">
                        <button onclick="window.location.href='/'" class="badge chip-neutral-label-small">
                            <span class="icon-home-outline">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M15.8252 16.6666H13.3335V10.8332C13.3335 10.3724 12.9602 9.99992 12.5002 9.99992H7.50024C7.03941 9.99992 6.66691 10.3724 6.66691 10.8332V16.6666H4.16691L4.17191 9.65242L9.99854 3.69322L15.8335 9.68658L15.8252 16.6666ZM8.33354 16.6666H11.6669V11.6666H8.33354V16.6666ZM17.0202 8.48742L10.596 1.91738C10.2819 1.59655 9.71854 1.59655 9.40438 1.91738L2.97941 8.48825C2.67524 8.80075 2.50024 9.23742 2.50024 9.68658V16.6666C2.50024 17.5857 3.20608 18.3332 4.07358 18.3332H7.50024H12.5002H15.926C16.7935 18.3332 17.5002 17.5857 17.5002 16.6666V9.68658C17.5002 9.23742 17.3252 8.80075 17.0202 8.48742Z"/>
                                </svg>
                            </span>
                        </button>
                        
                        <span class="icon-schevron-right">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M6.82135 4.68218L9.66675 8.00032L6.82135 11.3184C6.58536 11.5809 6.62402 11.9715 6.90668 12.1901C7.03135 12.2866 7.18268 12.3337 7.33335 12.3337C7.52402 12.3337 7.71335 12.2575 7.84535 12.1108L11.1787 8.39646C11.2047 8.36739 11.2181 8.33332 11.2374 8.30112C11.2534 8.27512 11.2727 8.25286 11.2847 8.22439C11.3147 8.15319 11.3327 8.07832 11.3327 8.00279L11.3334 8.00032L11.3327 7.99779C11.3327 7.92232 11.3147 7.84739 11.2847 7.77619C11.2727 7.74772 11.2534 7.72546 11.2374 7.69946C11.2181 7.66726 11.2047 7.63319 11.1787 7.60412L7.84535 3.88979C7.61002 3.62732 7.19002 3.59141 6.90668 3.81056C6.62402 4.02908 6.58536 4.4197 6.82135 4.68218Z"/>
                            </svg>
                        </span>
                            
                        <button onclick="navigateToGroupFromBreadcrumb()" href="" class="badge chip-neutral-label-small">
                            <span class="md-medium badge-title"></span>
                        </button>
                        
                        <span class="icon-schevron-right">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M6.82135 4.68218L9.66675 8.00032L6.82135 11.3184C6.58536 11.5809 6.62402 11.9715 6.90668 12.1901C7.03135 12.2866 7.18268 12.3337 7.33335 12.3337C7.52402 12.3337 7.71335 12.2575 7.84535 12.1108L11.1787 8.39646C11.2047 8.36739 11.2181 8.33332 11.2374 8.30112C11.2534 8.27512 11.2727 8.25286 11.2847 8.22439C11.3147 8.15319 11.3327 8.07832 11.3327 8.00279L11.3334 8.00032L11.3327 7.99779C11.3327 7.92232 11.3147 7.84739 11.2847 7.77619C11.2727 7.74772 11.2534 7.72546 11.2374 7.69946C11.2181 7.66726 11.2047 7.63319 11.1787 7.60412L7.84535 3.88979C7.61002 3.62732 7.19002 3.59141 6.90668 3.81056C6.62402 4.02908 6.58536 4.4197 6.82135 4.68218Z"/>
                            </svg>
                        </span>
                        
                        <button onclick="navigateToSubgroupFromBreadcrumb()" href="" class="badge chip-neutral-label-small">
                            <span class="md-medium badge-title"></span>
                        </button>
                    </div>
                </div>

                <div class="wrap-center detail-block1">
                    <h1 class="h1 detail-block1-title"></h1>
                    <div class="md-regular detail-block1-subtitle"></div>
                </div>

                <div class="detail-block2-list">
                    <!-- Элементы списка -->
                </div>
                
                <div class="wrap-center detail-block3">
                    <div class="detail-block3-list">
                        <div class="lg-regular detail-block3-author"></div>
                    </div>
                </div>

                <div class="wrap-center detail-ai">
                    <div class="lg-regular detail-ai-summary"></div>
                    <div class="detail-ai-label-wrap">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 36 36" fill="none">
                            <path d="M17.4497 4.50582C23.25 4.84461 23.4156 10.7781 22.7138 13.2172C29.7324 10.9869 32.4228 14.1466 32.8908 16.0053C33.7331 20.4655 29.4984 21.813 27.2759 21.9291C31.7678 27.5044 29.6154 30.292 27.9777 30.9889C22.9244 32.3829 20.0232 28.7821 19.2044 26.8075C16.9584 31.5465 13.1216 31.8021 11.4839 31.3374C6.7112 29.9436 8.79338 24.949 10.4311 22.626C3.6932 21.5109 2.71059 18.2122 3.06152 16.7022C4.18451 11.1268 10.0802 12.0559 12.8876 13.2172C11.7647 5.96934 15.4611 4.38966 17.4497 4.50582Z" fill="#7767E5" stroke="#7767E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M18.75 19.5L15.75 23.25" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M14.25 18.75L18.75 19.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M18 14.25L18.75 19.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M23.25 18L18.75 19.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M18.75 19.5L22.5 22.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <div class="sm-regular detail-ai-label">Библиотечка AI</div>
                    </div>
                </div>

                <div class="wrap-center detail-meta">
                    <div class="md-regular detail-meta-row"><span style="flex: 1 0 0;">Проведено</span><span class="start-date"></span> - <span class="end-date"></span></div>
                    <div class="md-regular detail-meta-row"><span style="flex: 1 0 0;">Статья опубликована</span><span class="published"></span></div>
                    <div class="md-regular detail-meta-row"><span style="flex: 1 0 0;">Номер в картотеке</span><span class="slug"></span></div>
                    <div class="md-regular detail-meta-row"><span style="flex: 1 0 0;">Обновлено</span><span class="updated-at"></span></div>
                    <div class="md-regular detail-meta-row"><span style="flex: 1 0 0;">Создано</span><span class="created-at"></span></div>
                    <div class="md-regular detail-meta-row"><span style="flex: 1 0 0;">Раздел</span><span class="group-slug"></span></div>
                    <div class="md-regular detail-meta-row"><span style="flex: 1 0 0;">Теги</span><span class="detail"></span></div>
                    <div class="md-regular detail-meta-row"><span style="flex: 1 0 0;">Категория</span><span class="subgroup-slug"></span></div>
                    <div class="md-regular detail-meta-row"><span style="flex: 1 0 0;">Появилось в версии</span><span class="version-slug"></span></div>
                    <div class="md-regular detail-meta-row"><span style="flex: 1 0 0;">Статус</span><span class="status-slug"></span></div>
                </div>
            </div>
        </template>
        <template id="detail-link-template">
            <a class="detail-block2-list-item" href="#" target="_blank">
                <div class="detail-block2-text">
                    <div class="lg-regular detail-block2-list-title"></div>
                    <div class="sm-regular detail-block2-list-subtitle"></div>
                </div>
                <span class="icon-diagonal-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M14.9944 5.87417C14.9944 5.41667 14.6244 5.04417 14.1661 5.04167L7.50521 5H7.50021C7.04187 5 6.67021 5.37 6.66687 5.82833C6.66354 6.28833 7.03438 6.66417 7.49521 6.66667L12.1269 6.69583L5.24438 13.5775C4.91854 13.9034 4.91854 14.4309 5.24438 14.7559C5.40688 14.9192 5.62021 15 5.83354 15C6.04687 15 6.26021 14.9192 6.42271 14.7559L13.3294 7.84917L13.3336 12.5009C13.3336 12.9609 13.7069 13.3334 14.1669 13.3334C14.6269 13.3334 15.0002 12.9592 15.0002 12.4992L14.9944 5.87417Z"/>
                    </svg>
                </span>
            </a>
        </template>
    </div>

    <div class="wrap-center detail-meta">
        <button style="width: 100%; border-radius: 12px;" class="secondary-text-lg" onclick="window.open('https://forms.yandex.ru/u/69386a2c02848f99bdd0ee07', '_blank')"><p class="md-regular">Форма обратной связи</p></button>
    </div>

    <?php include __DIR__ . '/partials/footer.php'; ?>
    <?php include __DIR__ . '/partials/drawer.php'; ?>
    <?php include __DIR__ . '/partials/search.php'; ?>


    <script src="/js/config.js"></script>
    <script src="/js/detail.js"></script>
    <script src="/js/drawer.js"></script>

</body>
</html>
<?php
$html = ob_get_clean();

// ─── Кэш и отдача ─────────────────────────────────────────────────────────────
$cacheDir = __DIR__ . '/cache';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}
@file_put_contents($cacheFile, $html);

header('Content-Type: text/html; charset=utf-8');
header('X-Cache: MISS');
echo $html;
