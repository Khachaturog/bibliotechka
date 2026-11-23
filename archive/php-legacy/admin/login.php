<?php
/**
 * Страница входа в админку
 * Безопасность: хеш пароля, rate limiting, secure cookies
 */

require_once __DIR__ . '/login-helpers.php';

// Secure session cookies (HTTPS в проде)
$isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/admin/',
    'domain' => '',
    'secure' => $isSecure,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

// Уже залогинен — редирект в админку
if (!empty($_SESSION['admin_logged_in'])) {
    header('Location: /admin/');
    exit;
}

$config = require __DIR__ . '/config.php';
$maxAttempts = $config['max_login_attempts'] ?? 5;
$blockMinutes = $config['block_duration_minutes'] ?? 30;

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Проверка rate limit
    $rateLimit = checkRateLimit($maxAttempts, $blockMinutes);
    if ($rateLimit['blocked']) {
        $error = $rateLimit['message'];
    } else {
        $input = $_POST['password'] ?? '';
        $passwordHash = $config['password_hash'] ?? null;
        $passwordPlain = $config['password'] ?? null;

        $valid = false;
        if ($passwordHash && password_verify($input, $passwordHash)) {
            $valid = true;
        } elseif ($passwordPlain !== null && $input === $passwordPlain) {
            $valid = true;
        }

        if ($valid) {
            clearAttemptsForIp();
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_last_activity'] = time();
            header('Location: /admin/');
            exit;
        }

        $error = 'Неверный пароль';
        recordFailedAttempt($maxAttempts, $blockMinutes);
    }
} else {
    // GET: показываем сообщение о блокировке если есть
    $rateLimit = checkRateLimit($maxAttempts, $blockMinutes);
    if ($rateLimit['blocked']) {
        $error = $rateLimit['message'];
    }
}

?>
<!DOCTYPE html>
<html lang="ru">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="robots" content="noindex, nofollow">

    <link rel="icon" href="../images/favicon.svg" type="image/svg+xml">
    <title>Вход — Админка Библиотечки</title>

    <link rel="stylesheet" href="https://unpkg.com/@adminkit/core@latest/dist/css/app.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap">

    <style>
        body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--ak-admin-body-bg, #f0f2f5); }
        .login-card { max-width: 400px; width: 100%; }
    </style>
</head>

<body>
    <div class="login-card card">
        <div class="card-body">
            <h4 class="card-title mb-4">Вход в админку</h4>

            <?php if ($error): ?>
                <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>

            <form method="post" action="">
                <div class="mb-3">
                    <label class="form-label">Пароль</label>
                    <input type="password" name="password" class="form-control" required autofocus placeholder="Введите пароль">
                </div>
                <button type="submit" class="btn btn-primary w-100">Войти</button>
            </form>

            <p class="text-muted small mt-3 mb-0">
                Пароль: <code>ADMIN_PASSWORD</code> или <code>ADMIN_PASSWORD_HASH</code> (env), либо <code>config.php</code>
            </p>
        </div>
    </div>
</body>

</html>
