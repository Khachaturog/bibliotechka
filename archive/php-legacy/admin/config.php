<?php
/**
 * Конфигурация админки
 * Пароль задаётся здесь или через env (ADMIN_PASSWORD / ADMIN_PASSWORD_HASH)
 * 
 * Генерация хеша (bcrypt, надёжно везде):
 *   php -r "echo password_hash('ваш_пароль', PASSWORD_BCRYPT);"
 */

$password = getenv('ADMIN_PASSWORD');
$passwordHash = getenv('ADMIN_PASSWORD_HASH');

return [
    // Хеш (bcrypt): php -r "echo password_hash('пароль', PASSWORD_BCRYPT);"
    // Bcrypt: ровно 60 символов, без пробелов. Были лишние пробелы и % — исправлено.
    'password_hash' => null,
    // Fallback: если хеш не подходит, укажите пароль сюда и войдите
    'password' => 'jybzeg-7demfu-kofhaK',
    'max_login_attempts' => 5,
    'block_duration_minutes' => 30,
];
