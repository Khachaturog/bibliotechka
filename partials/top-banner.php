<?php
if (!defined('SITE_BASE_URL')) {
    require_once __DIR__ . '/../api/config.php';
}
?>
<div class="site-top-banner" role="region" aria-labelledby="site-top-banner-title">
    <div class="site-top-banner__inner">
        <p id="site-top-banner-title" class="site-top-banner__lead md-regular">
            <span class="site-top-banner__badge">Важно</span>
            Домен сайта изменился: теперь мы на
            <a href="<?= htmlspecialchars(SITE_BASE_URL, ENT_QUOTES, 'UTF-8') ?>">bibliotechka.site</a>
            — сохраните эту ссылку в закладках.
        </p>
        <p class="site-top-banner__text sm-regular">
            Старый адрес <span class="site-top-banner__nowrap">bibliotechka.online</span> оплачен только
            <strong>до&nbsp;2&nbsp;мая&nbsp;2026</strong> включительно; после этой даты он перестанет открываться.
            Пока он действует, все переходы с него автоматически ведут сюда (<span class="site-top-banner__nowrap">редирект 301</span>).
        </p>
    </div>
</div>
