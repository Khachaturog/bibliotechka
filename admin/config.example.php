<?php
/**
 * Конфигурация админки
 * Скопируйте в config.php и задайте пароль
 *
 * cp config.example.php config.php
 *
 * Рекомендуется: задать ADMIN_PASSWORD или ADMIN_PASSWORD_HASH через env
 * Для генерации хеша: php -r "echo password_hash('ваш_пароль', PASSWORD_ARGON2ID);"
 */

$password = getenv('ADMIN_PASSWORD');
$passwordHash = getenv('ADMIN_PASSWORD_HASH');

return [
    // Хеш пароля (предпочтительно для продакшена)
    'password_hash' => $passwordHash ?: null,
    // Plain password (fallback: env или 'admin' для локальной разработки)
    'password' => $password ?: 'admin',
    // Rate limiting: 5 попыток → блок на 30 мин
    'max_login_attempts' => 5,
    'block_duration_minutes' => 30,
];
