<?php
/**
 * SSR главная страница — генерирует полноценный HTML с данными из БД.
 * Поисковые роботы видят все группы и карточки без JS.
 * JS по-прежнему запускается в браузере для интерактивности.
 */

require_once __DIR__ . '/api/config.php';

function e(string|int|float|null $value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

// ─── Файловый кэш (TTL 24 часа) ──────────────────────────────────────────────
$cacheFile = __DIR__ . '/cache/index.html';
$cacheTtl  = 86400;

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
    header('Content-Type: text/html; charset=utf-8');
    header('X-Cache: HIT');
    readfile($cacheFile);
    exit;
}

// ─── Данные из БД ─────────────────────────────────────────────────────────────
$db = getDBConnection();

$groups = $db->query(
    "SELECT slug, title_ru, cover, description_ru FROM `groups` ORDER BY sort"
)->fetchAll();

$cards = $db->query(
    "SELECT slug, url_seo_yandex, title, description, cover_short
     FROM data WHERE status_slug = 'published' ORDER BY slug"
)->fetchAll();

$cardCount = count($cards);

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

    <title>Библиотечка — коллекция материалов для дизайнеров</title>
    <meta name="description" content="Библиотечка — коллекция <?= $cardCount ?>+ лучших материалов по дизайну, UX/UI, типографике и вдохновению. Ресурсы, дизайн-системы, портфолио и книги для дизайнеров.">

    <link rel="canonical" href="https://bibliotechka.online">
    <link rel="alternate" hreflang="ru" href="https://bibliotechka.online">
    <link rel="alternate" hreflang="x-default" href="https://bibliotechka.online">

    <meta property="og:title" content="Библиотечка — коллекция материалов для дизайнеров">
    <meta property="og:description" content="Библиотечка — коллекция <?= $cardCount ?>+ лучших материалов по дизайну, UX/UI, типографике и вдохновению.">
    <meta property="og:image" content="https://bibliotechka.online/images/preview.webp">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://bibliotechka.online">
    <meta property="og:locale" content="ru_RU">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@bibliotechka">
    <meta name="twitter:title" content="Библиотечка — коллекция материалов для дизайнеров">
    <meta name="twitter:description" content="Библиотечка — коллекция <?= $cardCount ?>+ лучших материалов по дизайну, UX/UI, типографике и вдохновению.">
    <meta name="twitter:image" content="https://bibliotechka.online/images/preview.webp">

    <meta name="robots" content="index, follow">
    <meta name="yandex-verification" content="9e48f4959071c524">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap">

    <link rel="stylesheet" href="/css/base.css">

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Библиотечка",
      "url": "https://bibliotechka.online",
      "description": "Коллекция лучших материалов по дизайну, UX/UI, типографике и вдохновению"
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Библиотечка",
      "url": "https://bibliotechka.online",
      "logo": {
        "@type": "ImageObject",
        "url": "https://bibliotechka.online/images/preview.webp"
      },
      "description": "Коллекция лучших материалов для дизайнеров: UX/UI, типографика, дизайн-системы, вдохновение"
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Библиотечка — материалы для дизайнеров",
      "url": "https://bibliotechka.online",
      "description": "Коллекция <?= $cardCount ?> материалов для дизайнеров: ресурсы, дизайн-системы, книги и вдохновение",
      "numberOfItems": <?= $cardCount ?>
    }
    </script>

    <!-- Скрываем SSR-контент при наличии JS -->
    <script>document.documentElement.classList.add('js');</script>
    <style>html.js #ssr-content { display: none !important; }</style>

    <!-- Yandex.Metrika counter -->
    <script type="text/javascript">
        (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
        })(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
        ym(101553574,'init',{webvisor:true,clickmap:true,accurateTrackBounce:true,trackLinks:true});
    </script>
    <noscript><div><img src="https://mc.yandex.ru/watch/101553574" style="position:absolute; left:-9999px;" alt=""></div></noscript>
    <!-- /Yandex.Metrika counter -->
</head>

<body>
    <section class="wrap-start">
        <?php include __DIR__ . '/partials/header.php'; ?>
    </section>

    <!-- SSR-контент: виден поисковым роботам, скрыт при работе JS.
         Намеренно используем классы ssr-* чтобы не конфликтовать
         с .groups-container / .cards-container, на которые нацелен js/index.js -->
    <div id="ssr-content">
        <section class="wrap-center">
            <div class="ssr-groups-list">
                <?php foreach ($groups as $group): ?>
                <a class="group" href="/<?= e($group['slug']) ?>">
                    <div class="group-cover-wrap">
                        <img class="group-cover" src="<?= e($group['cover']) ?>" alt="<?= e($group['title_ru']) ?>" loading="lazy">
                    </div>
                    <div class="group-content">
                        <p class="h4 group-title"><?= e($group['title_ru']) ?></p>
                        <?php if (!empty($group['description_ru'])): ?>
                        <p class="sm-regular group-description"><?= e($group['description_ru']) ?></p>
                        <?php endif; ?>
                    </div>
                </a>
                <?php endforeach; ?>
            </div>
        </section>

        <section class="wrap-center">
            <div class="ssr-cards-section cards-container-0">
                <h2 class="h1 container-title">Карточки <span class="sm-italic"><?= $cardCount ?></span></h2>
                <div class="ssr-cards-list">
                    <?php foreach ($cards as $card): ?>
                    <a class="card" href="/card/<?= e($card['url_seo_yandex']) ?>">
                        <img class="card-cover" src="<?= e($card['cover_short']) ?>" alt="<?= e($card['title']) ?>" loading="lazy">
                        <p class="lg-medium card-title"><?= e($card['title']) ?></p>
                        <?php if (!empty($card['description'])): ?>
                        <p class="md-regular card-description"><?= e($card['description']) ?></p>
                        <?php endif; ?>
                    </a>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>
    </div>

    <!-- Динамический контент для браузеров с JS -->
    <section class="wrap-center">
        <div class="groups-container">
            <div class="skeletons-container" id="groups-skeletons">
                <div class="skeleton-group"><div class="skeleton skeleton-group-cover"></div><div class="skeleton skeleton-group-title"></div></div>
                <div class="skeleton-group"><div class="skeleton skeleton-group-cover"></div><div class="skeleton skeleton-group-title"></div></div>
                <div class="skeleton-group"><div class="skeleton skeleton-group-cover"></div><div class="skeleton skeleton-group-title"></div></div>
                <div class="skeleton-group"><div class="skeleton skeleton-group-cover"></div><div class="skeleton skeleton-group-title"></div></div>
                <div class="skeleton-group"><div class="skeleton skeleton-group-cover"></div><div class="skeleton skeleton-group-title"></div></div>
                <div class="skeleton-group"><div class="skeleton skeleton-group-cover"></div><div class="skeleton skeleton-group-title"></div></div>
                <div class="skeleton-group"><div class="skeleton skeleton-group-cover"></div><div class="skeleton skeleton-group-title"></div></div>
                <div class="skeleton-group"><div class="skeleton skeleton-group-cover"></div><div class="skeleton skeleton-group-title"></div></div>
            </div>
            <template class="group-template">
                <a class="group" href="">
                    <div class="group-cover-wrap">
                        <img class="group-cover" src="" alt="">
                    </div>
                    <div class="group-content">
                        <p class="h4 group-title"></p>
                        <p class="sm-regular group-description"></p>
                    </div>
                </a>
            </template>
        </div>
    </section>

    <section class="wrap-center">
        <div class="cards-container-0">
            <h2 class="h1 container-title">Карточки <span class="sm-italic" id="cards-count"></span></h2>
            <div class="cards-container">
                <div class="skeletons-container" id="cards-skeletons">
                    <div class="skeleton-card"><div class="skeleton skeleton-card-cover"></div><div class="skeleton skeleton-card-title"></div><div class="skeleton skeleton-card-description"></div></div>
                    <div class="skeleton-card"><div class="skeleton skeleton-card-cover"></div><div class="skeleton skeleton-card-title"></div><div class="skeleton skeleton-card-description"></div></div>
                    <div class="skeleton-card"><div class="skeleton skeleton-card-cover"></div><div class="skeleton skeleton-card-title"></div><div class="skeleton skeleton-card-description"></div></div>
                    <div class="skeleton-card"><div class="skeleton skeleton-card-cover"></div><div class="skeleton skeleton-card-title"></div><div class="skeleton skeleton-card-description"></div></div>
                    <div class="skeleton-card"><div class="skeleton skeleton-card-cover"></div><div class="skeleton skeleton-card-title"></div><div class="skeleton skeleton-card-description"></div></div>
                    <div class="skeleton-card"><div class="skeleton skeleton-card-cover"></div><div class="skeleton skeleton-card-title"></div><div class="skeleton skeleton-card-description"></div></div>
                </div>
                <template class="card-template">
                    <a class="card" href="">
                        <img class="card-cover" src="" alt="" loading="lazy">
                        <p class="lg-medium card-title"></p>
                        <p class="md-regular card-description"></p>
                    </a>
                </template>
            </div>
        </div>
    </section>

    <?php include __DIR__ . '/partials/footer.php'; ?>
    <?php include __DIR__ . '/partials/drawer.php'; ?>
    <?php include __DIR__ . '/partials/search.php'; ?>


    <script src="/js/config.js"></script>
    <script src="/js/index.js"></script>
    <script src="/js/drawer.js"></script>

</body>
</html>
<?php
$html = ob_get_clean();

// Сохраняем в кэш
$cacheDir = __DIR__ . '/cache';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}
@file_put_contents($cacheFile, $html);

header('Content-Type: text/html; charset=utf-8');
header('X-Cache: MISS');
echo $html;
