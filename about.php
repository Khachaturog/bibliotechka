<?php
/**
 * SSR страница «О проекте» — история версий из БД.
 * Файловый кэш 24 часа.
 */

require_once __DIR__ . '/api/config.php';

function aboutE(string|int|float|null $value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function formatDateRu(?string $dateStr): string {
    if (!$dateStr) return '';
    $months = ['января','февраля','марта','апреля','мая','июня',
               'июля','августа','сентября','октября','ноября','декабря'];
    $ts = strtotime(trim($dateStr));
    if (!$ts) return $dateStr;
    return date('j', $ts) . ' ' . $months[(int)date('n', $ts) - 1] . ' ' . date('Y', $ts);
}

// ─── Файловый кэш (TTL 24 часа) ──────────────────────────────────────────────
$cacheFile = __DIR__ . '/cache/about.html';
$cacheTtl  = 86400;

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
    header('Content-Type: text/html; charset=utf-8');
    header('X-Cache: HIT');
    readfile($cacheFile);
    exit;
}

// ─── Данные из БД ─────────────────────────────────────────────────────────────
$db = getDBConnection();
$stmtVersions = $db->query(
    "SELECT slug, version, title, description, release_date, url
     FROM versions
     ORDER BY COALESCE(STR_TO_DATE(release_date, '%M %e, %Y'), release_date) DESC, slug DESC"
);
$versions     = $stmtVersions->fetchAll();
$versionCount = count($versions);

// ─── Генерация HTML ───────────────────────────────────────────────────────────
ob_start();
?>
<!DOCTYPE html>
<html lang="ru">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="/images/favicon.svg" type="image/svg+xml">

    <meta name="theme-color" content="#FFFFFF">

    <!-- Принудительное использование HTTPS для всех запросов -->
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">

    <!-- Hide server-rendered SEO block when JS is enabled -->
    <script>document.documentElement.classList.add('js');</script>
    <style>html.js #ssr-content { display: none !important; }</style>

    <title>О проекте — Библиотечка</title>
    <meta name="description" content="История и развитие проекта «Библиотечка»: зачем он нужен, как развивался и что нового появляется в версиях.">
    <link rel="canonical" href="<?= SITE_BASE_URL ?>/about">

    <meta property="og:title" content="О проекте — Библиотечка">
    <meta property="og:description" content="История и развитие проекта «Библиотечка» и подробный changelog релизов.">
    <meta property="og:image" content="<?= SITE_BASE_URL ?>/images/preview.webp">
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?= SITE_BASE_URL ?>/about">
    <meta property="og:locale" content="ru_RU">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="О проекте — Библиотечка">
    <meta name="twitter:description" content="История и развитие проекта «Библиотечка» и подробный changelog релизов.">
    <meta name="twitter:image" content="<?= SITE_BASE_URL ?>/images/preview.webp">

    <link rel="alternate" hreflang="ru" href="<?= SITE_BASE_URL ?>/about">
    <link rel="alternate" hreflang="x-default" href="<?= SITE_BASE_URL ?>/about">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap">

    <link rel="stylesheet" href="/css/base.css">

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
    <div id="ssr-content">
        <h1>О проекте — Библиотечка</h1>
        <h2>История версий</h2>
        <?php foreach ($versions as $v): ?>
        <article>
            <?php if (!empty($v['version'])): ?>
            <p><strong>Версия <?= aboutE($v['version']) ?></strong></p>
            <?php endif; ?>
            <?php if (!empty($v['release_date'])): ?>
            <p><?= aboutE(formatDateRu($v['release_date'])) ?></p>
            <?php endif; ?>
            <?php if (!empty($v['title'])): ?>
            <h3><?= aboutE($v['title']) ?></h3>
            <?php endif; ?>
            <?php if (!empty($v['description'])): ?>
            <p><?= aboutE($v['description']) ?></p>
            <?php endif; ?>
            <?php if (!empty($v['url'])): ?>
            <a href="<?= aboutE($v['url']) ?>" rel="noopener noreferrer" target="_blank">Подробнее</a>
            <?php endif; ?>
        </article>
        <?php endforeach; ?>
    </div>

    <section class="wrap-start">
        <?php include __DIR__ . '/partials/header.php'; ?>
    </section>

<section class="wrap-center">
    <div id="cards-container-title">
        <button class="secondary-sm" onclick="window.location.href='/'" aria-label="Вернуться на главную">
            <span class="icon-schevron-left">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"
                fill="none">
                    <path d="M6.25 10.0094C6.25 9.77618 6.34628 9.56234 6.50032 9.38743L12.2577 3.5954C12.6043 3.24554 13.1434 3.24554 13.4901 3.5954C13.8367 3.94525 13.8367 4.48947 13.4901 4.83933L8.32959 10.0094L13.4708 15.16C13.8174 15.5098 13.8174 16.0541 13.4708 16.4039C13.1242 16.7538 12.5851 16.7538 12.2384 16.4039L6.48107 10.6313C6.32702 10.4758 6.25 10.2426 6.25 10.0094Z"/>
                </svg>
            </span>
        </button>
        <h1 class="h1">О проекте</h1>
    </div>
</section>

<section class="wrap-center">
    <div class="versions-wrap">

        <div>
            <h2 class="h1 container-title">История версий<span class="sm-italic" id="versions-count"><?= $versionCount ?: '' ?></span></h2>
        </div>

        <div class="versions-container" id="versions-container">
            <div class="skeleton-versions" id="versions-skeletons">
                <div class="skeleton-version">
                    <div class="skeleton skeleton-card-description"></div>
                    <div class="skeleton skeleton-card-title"></div>
                </div>
                <div class="skeleton-version">
                    <div class="skeleton skeleton-card-description"></div>
                    <div class="skeleton skeleton-card-title"></div>
                </div>
                <div class="skeleton-version">
                    <div class="skeleton skeleton-card-description"></div>
                    <div class="skeleton skeleton-card-title"></div>
                </div>
            </div>

            <template class="version-template">
                <article class="version-card">
                    <div class="version-card-header">
                        <div class="md-regular version-label"></div>
                        <div class="md-regular version-date"></div>
                    </div>
                    <div>
                        <div class="h3 version-title"></div>
                        <div class="lg-regular version-description"></div>
                        <a class="version-link-button version-link" href="#" target="_blank" rel="noopener"></a>
                    </div>
                </article>
            </template>
        </div>

        <div class="versions-error md-regular" id="versions-error" hidden>
            Не удалось загрузить историю версий. Пожалуйста, обновите страницу позже.
        </div>

    </div>
</section>

    <?php include __DIR__ . '/partials/footer.php'; ?>
    <?php include __DIR__ . '/partials/drawer.php'; ?>
    <?php include __DIR__ . '/partials/search.php'; ?>

    <script src="/js/config.js"></script>
    <script src="/js/about.js"></script>
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
