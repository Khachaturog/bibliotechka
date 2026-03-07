<?php
http_response_code(404);
require_once __DIR__ . '/api/config.php';
?>
<!DOCTYPE html>
<html lang="ru">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="/images/favicon.svg" type="image/svg+xml">
    <meta name="theme-color" content="#FFFFFF">

    <title>404 — Страница не найдена | Библиотечка</title>
    <meta name="robots" content="noindex, nofollow">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap">

    <link rel="stylesheet" href="/css/base.css">

    <script>document.documentElement.classList.add('js');</script>
</head>

<body>
    <section class="wrap-start">
        <?php include __DIR__ . '/partials/header.php'; ?>
    </section>

    <section class="wrap-center">
        <div style="padding: 64px 0; text-align: center;">
            <p class="sm-italic" style="margin-bottom: 12px;">404</p>
            <h1 class="h1" style="margin-bottom: 16px;">Страница не найдена</h1>
            <p class="lg-regular" style="margin-bottom: 32px; opacity: 0.6;">У Библиотечки, правда, большой потенциал, но сейчас эта страница пуста,<br>а всё самое вкусное находится на главной.</p>
            <a href="/" class="primary">На главную</a>
        </div>
    </section>

    <?php include __DIR__ . '/partials/footer.php'; ?>
    <?php include __DIR__ . '/partials/drawer.php'; ?>
    <?php include __DIR__ . '/partials/search.php'; ?>

    <script src="/js/config.js"></script>
    <script src="/js/drawer.js"></script>

</body>
</html>
