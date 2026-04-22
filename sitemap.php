<?php
/**
 * Динамический sitemap.xml с данными из БД.
 * Роутится из /sitemap.xml через .htaccess.
 */

require_once __DIR__ . '/api/config.php';

// ─── Файловый кэш ─────────────────────────────────────────────────────────────
$cacheFile = __DIR__ . '/cache/sitemap.xml';
$cacheTtl  = 86400; // 24 часа

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
    header('Content-Type: application/xml; charset=utf-8');
    readfile($cacheFile);
    exit;
}

$db = getDBConnection();

// Карточки (опубликованные, с датой обновления)
$cards = $db->query(
    "SELECT url_seo_yandex, updated_at FROM data
     WHERE status_slug = 'published' AND url_seo_yandex IS NOT NULL AND url_seo_yandex != ''
     ORDER BY updated_at DESC"
)->fetchAll();

// Группы
$groups = $db->query(
    "SELECT slug FROM `groups` ORDER BY sort"
)->fetchAll();

$base = SITE_BASE_URL;
$today = date('Y-m-d');

ob_start();
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Главная страница -->
  <url>
    <loc><?= $base ?></loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Страница «О проекте» -->
  <url>
    <loc><?= $base ?>/about</loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

<?php foreach ($groups as $group): ?>
  <!-- Группа -->
  <url>
    <loc><?= $base ?>/<?= htmlspecialchars($group['slug'], ENT_XML1) ?></loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
<?php endforeach; ?>

<?php foreach ($cards as $card): ?>
<?php
  $lastmod = $today;
  if (!empty($card['updated_at'])) {
      $ts = strtotime($card['updated_at']);
      if ($ts) $lastmod = date('Y-m-d', $ts);
  }
?>
  <url>
    <loc><?= $base ?>/card/<?= htmlspecialchars($card['url_seo_yandex'], ENT_XML1) ?></loc>
    <lastmod><?= $lastmod ?></lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
<?php endforeach; ?>

</urlset>
<?php
$xml = ob_get_clean();

$cacheDir = __DIR__ . '/cache';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}
@file_put_contents($cacheFile, $xml);

header('Content-Type: application/xml; charset=utf-8');
echo $xml;
