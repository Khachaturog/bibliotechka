<?php
/**
 * SSR страница группы: /{slug}
 * - Уникальные meta/canonical/OG для каждой группы
 * - SSR-блок с карточками (виден поисковикам, скрыт при JS)
 * - Файловый кэш 24 часа
 */

require_once __DIR__ . '/api/config.php';

function groupE(string|int|float|null $value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
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

// ─── Файловый кэш (TTL 24 часа) ──────────────────────────────────────────────
$cacheFile = __DIR__ . '/cache/group-' . preg_replace('/[^a-z0-9-]/', '', $slug) . '.html';
$cacheTtl  = 86400;

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
    header('Content-Type: text/html; charset=utf-8');
    header('X-Cache: HIT');
    echo injectTopBannerAfterBodyOpen(file_get_contents($cacheFile));
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

$stmtSubgroups = $db->prepare(
    "SELECT slug, title_ru, description_ru FROM subgroups WHERE group_slug = ? ORDER BY sort"
);
$stmtSubgroups->execute([$slug]);
$subgroups = $stmtSubgroups->fetchAll();

$stmtCards = $db->prepare(
    "SELECT slug, url_seo_yandex, title, description, cover_short, subgroup_slug
     FROM data WHERE group_slug = ? AND status_slug = 'published' ORDER BY slug"
);
$stmtCards->execute([$slug]);
$cards = $stmtCards->fetchAll();

// ─── SEO-данные ───────────────────────────────────────────────────────────────
$canonicalUrl = SITE_BASE_URL . '/' . rawurlencode($slug);
$title        = trim($group['title_ru'] ?? '');
$description  = trim($group['description_ru'] ?? '');
$cover        = trim($group['cover'] ?? '');
$cardCount    = count($cards);

$pageTitle = $title ? $title . ' — Библиотечка' : 'Библиотечка';
$pageDesc  = $description
    ? $description . ' (' . $cardCount . ' материалов)'
    : 'Раздел «' . $title . '» — ' . $cardCount . ' материалов на Библиотечке.';

$ogImage = $cover ? absoluteUrl($cover) : '';

// ─── Генерация HTML ───────────────────────────────────────────────────────────
ob_start();
?>
<!DOCTYPE html>
<html lang="ru">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="/">
    <link rel="icon" href="/images/favicon.svg" type="image/svg+xml">

    <meta name="theme-color" content="#FFFFFF">

    <!-- Принудительное использование HTTPS для всех запросов -->
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">

    <!-- Hide server-rendered SEO block when JS is enabled -->
    <script>document.documentElement.classList.add('js');</script>
    <style>html.js #ssr-content { display: none !important; }</style>

    <title><?= groupE($pageTitle) ?></title>
    <meta name="description" content="<?= groupE($pageDesc) ?>">
    <link rel="canonical" href="<?= groupE($canonicalUrl) ?>">

    <meta property="og:type" content="website">
    <meta property="og:title" content="<?= groupE($pageTitle) ?>">
    <meta property="og:description" content="<?= groupE($pageDesc) ?>">
    <meta property="og:url" content="<?= groupE($canonicalUrl) ?>">
    <?php if ($ogImage): ?>
    <meta property="og:image" content="<?= groupE($ogImage) ?>">
    <?php endif; ?>
    <meta property="og:locale" content="ru_RU">

    <link rel="alternate" hreflang="ru" href="<?= groupE($canonicalUrl) ?>">
    <link rel="alternate" hreflang="x-default" href="<?= groupE($canonicalUrl) ?>">

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

<body>
    <?php include __DIR__ . '/partials/top-banner.php'; ?>

    <!-- SSR-блок: виден поисковым роботам, скрыт при работе JS (html.js #ssr-content) -->
    <div id="ssr-content">
        <h1><?= groupE($title) ?></h1>
        <?php if ($description): ?>
        <p><?= groupE($description) ?></p>
        <?php endif; ?>
        <?php
        $bySubgroup = [];
        foreach ($cards as $card) {
            $bySubgroup[$card['subgroup_slug'] ?? ''][] = $card;
        }
        foreach ($subgroups as $sg):
            $sgCards = $bySubgroup[$sg['slug']] ?? [];
            if (empty($sgCards)) continue;
        ?>
        <section>
            <h2><?= groupE($sg['title_ru']) ?></h2>
            <?php if (!empty($sg['description_ru'])): ?>
            <p><?= groupE($sg['description_ru']) ?></p>
            <?php endif; ?>
            <?php foreach ($sgCards as $card): ?>
            <?php $cardUrl = '/card/' . rawurlencode((string)($card['url_seo_yandex'] ?? '')); ?>
            <a href="<?= groupE($cardUrl) ?>">
                <?php if (!empty($card['cover_short'])): ?>
                <img src="<?= groupE($card['cover_short']) ?>" alt="<?= groupE($card['title']) ?>" loading="lazy">
                <?php endif; ?>
                <?= groupE($card['title']) ?>
                <?php if (!empty($card['description'])): ?>
                 — <?= groupE($card['description']) ?>
                <?php endif; ?>
            </a>
            <?php endforeach; ?>
        </section>
        <?php endforeach; ?>
        <?php
        // Карточки без подгруппы
        $noSubgroupCards = $bySubgroup[''] ?? [];
        if (!empty($noSubgroupCards)):
        ?>
        <section>
            <?php foreach ($noSubgroupCards as $card): ?>
            <?php $cardUrl = '/card/' . rawurlencode((string)($card['url_seo_yandex'] ?? '')); ?>
            <a href="<?= groupE($cardUrl) ?>">
                <?php if (!empty($card['cover_short'])): ?>
                <img src="<?= groupE($card['cover_short']) ?>" alt="<?= groupE($card['title']) ?>" loading="lazy">
                <?php endif; ?>
                <?= groupE($card['title']) ?>
                <?php if (!empty($card['description'])): ?>
                 — <?= groupE($card['description']) ?>
                <?php endif; ?>
            </a>
            <?php endforeach; ?>
        </section>
        <?php endif; ?>
    </div>

    <section class="wrap-start">
        <?php include __DIR__ . '/partials/header.php'; ?>
    </section>

    <!-- Заголовок -->
    <section class="wrap-center">
        <section id="cards-container-title">
            <button class="secondary-sm" onclick="window.location.href='/'" aria-label="Назад">
                <span class="icon-schevron-left">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                        d="M11.4735 5.85248L7.91673 10.0002L11.4735 14.1477C11.7685 14.4758 11.7201 14.9642 11.3668 15.2373C11.211 15.358 11.0218 15.4168 10.8335 15.4168C10.5951 15.4168 10.3585 15.3217 10.1935 15.1382L6.02671 10.4953C5.99421 10.459 5.97754 10.4164 5.95337 10.3762C5.93337 10.3437 5.90921 10.3158 5.89421 10.2802C5.85671 10.1912 5.83421 10.0977 5.83421 10.0032L5.83337 10.0002L5.83421 9.99699C5.83421 9.90266 5.85671 9.80899 5.89421 9.71999C5.90921 9.68441 5.93337 9.65658 5.95337 9.62408C5.97754 9.58383 5.99421 9.54124 6.02671 9.50491L10.1935 4.86199C10.4876 4.5339 11.0126 4.48902 11.3668 4.76295C11.7201 5.0361 11.7685 5.52439 11.4735 5.85248Z"/>
                    </svg>
                </span>
            </button>
            <div class="cards-container-0-header" style="border-radius: 8px 20px 20px 8px;">
                <h1 class="h1 container-title"></h1>
                <p class="md-regular container-description"></p>
            </div>
        </section>
    </section>

    <!-- Бейджики подгрупп -->
    <section class="badge-wrap subgroups-badge-wrap">
        <template class="badge-template">
            <a href="" class="badge chip-neutral-label-small">
                <span class="md-medium badge-title"></span>
            </a>
        </template>
    </section>

    <!-- Карточки -->
    <main class="subgroups-wrap">
        <!-- Хедер подгруппы с карточками -->
        <template id="subgroup-template">
            <div class="wrap-center cards-container-0">
                
                <div class="cards-container-0-header">
                    <div>
                        <div class="title-with-button">
                            <p class="h1 container-title"></p>
                            <button class="subtle-violet-24" aria-label="Скопировать ссылку">
                                <svg class="icon-link" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                viewBox="0 0 20 20" fill="none">
                                    <path fill-rule="evenodd" clip-rule="evenodd"
                                d="M9.60594 3.24961C11.4243 1.42711 14.3584 1.09794 16.3851 2.68294C18.8126 4.58128 18.9718 8.11878 16.8626 10.2329L15.6768 11.4204C15.3493 11.7488 14.8193 11.7488 14.4918 11.4204C14.1643 11.0929 14.1643 10.5604 14.4918 10.2329L15.6768 9.04461C17.0559 7.66378 16.9809 5.36794 15.4501 4.08628C14.0943 2.95044 12.0593 3.16711 10.8101 4.41878L9.74927 5.48128C9.4226 5.80961 8.89094 5.80961 8.56427 5.48128C8.23677 5.15378 8.23344 4.62461 8.71177 4.14544L9.60594 3.24961ZM11.0775 7.74403L7.74419 11.0774C7.41835 11.4032 7.41835 11.9299 7.74419 12.2557C7.90669 12.4182 8.12002 12.4999 8.33335 12.4999C8.54669 12.4999 8.76002 12.4182 8.92252 12.2557L12.2559 8.92236C12.5817 8.59653 12.5817 8.06986 12.2559 7.74403C11.93 7.41819 11.4034 7.41819 11.0775 7.74403ZM10.2336 14.4969L9.17194 15.5561C7.9211 16.8036 5.88194 17.0186 4.52527 15.8878C2.99277 14.6111 2.91694 12.3228 4.29777 10.9453L5.48527 9.76194C5.81277 9.43528 5.81277 8.90528 5.48527 8.57778C5.15777 8.25194 4.6261 8.25194 4.29777 8.57778L3.23527 9.63861C1.42527 11.4436 1.10777 14.3469 2.67277 16.3669C4.56527 18.8111 8.11527 18.9761 10.2336 16.8644L11.4211 15.6811C11.7486 15.3536 11.7486 14.8244 11.4211 14.4969C11.0928 14.1694 10.5619 14.1694 10.2336 14.4969Z"/>
                                </svg>
                            
                                <svg class="icon-copied" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                            viewBox="0 0 20 20" fill="none">
                                    <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M8.2194 14.9999C7.9894 14.9999 7.7694 14.9049 7.6119 14.7374L3.5594 10.4216C3.24357 10.0866 3.26107 9.55907 3.59607 9.24407C3.9319 8.92907 4.4594 8.94573 4.77357 9.28073L8.21107 12.9399L15.2177 5.27156C15.5294 4.93072 16.0561 4.90822 16.3961 5.21822C16.7352 5.52822 16.7586 6.05572 16.4486 6.39489L8.83439 14.7282C8.67855 14.8999 8.45689 14.9982 8.22524 14.9999H8.2194Z"/>
                                </svg>
                    
                        </button>
                    </div>
                </div>
                <p class="lg-regular container-description" hidden></p>
            </div>
            
            <div class="cards-container"></div>
            
        </div>
    </template>
    </main>

    <template class="card-template">
        <a class="card" href="">
            <img class="card-cover" width="200" height="125" src="" alt="" loading="lazy">
            <p class="lg-medium card-title"></p>
            <p class="md-regular card-description"></p>
        </a>
    </template>

    <!-- Другие группы -->
    <section class="wrap-center cards-container-0">
        <h2 class="h1" style="color:var(--02-content-primary);">Другие группы</h2>
        <section class="other-groups-badge-wrap other-groups-wrap" hidden>
            <template class="other-group-badge-template">
                <a href="" class="chip-neutral-label-small other-group-badge">
                    <span class="md-medium other-group-badge-title"></span>
                </a>
            </template>
        </section>
    </section>
    
    <!-- Кнопка "Наверх" -->
    <button class="secondary-lg-full button-up">
        <span class="icon-up">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.36001 8.86632C4.65501 9.21966 5.18001 9.26799 5.53334 8.97299L9.16666 5.94551V15.833C9.16666 16.293 9.54 16.6663 10 16.6663C10.46 16.6663 10.8333 16.293 10.8333 15.833V5.94551L14.4667 8.97299C14.8208 9.26799 15.3458 9.21966 15.64 8.86632C15.935 8.51299 15.8875 7.98717 15.5333 7.69301L10.5333 3.52634C10.4942 3.49301 10.4475 3.47717 10.4042 3.45217C10.37 3.43217 10.34 3.40884 10.3025 3.39384C10.205 3.35551 10.1033 3.33301 10 3.33301C9.89666 3.33301 9.795 3.35551 9.6975 3.39384C9.66 3.40884 9.63 3.43217 9.59583 3.45217C9.5525 3.47717 9.50583 3.49301 9.46666 3.52634L4.46667 7.69301C4.11334 7.98717 4.06501 8.51299 4.36001 8.86632Z"/>
            </svg>
        </span>
    </button>

    <?php include __DIR__ . '/partials/footer.php'; ?>
    <?php include __DIR__ . '/partials/drawer.php'; ?>
    <?php include __DIR__ . '/partials/search.php'; ?>


    <script src="/js/config.js"></script>
    <script src="/js/group.js"></script>
    <script src="/js/drawer.js"></script>

</body>
</html>
<?php
$content = ob_get_clean();

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
