# Админка Библиотечки

## Вход

1. Откройте `/admin/` — перенаправит на `/admin/login.php`
2. Пароль по умолчанию: **admin** (только для локальной разработки)
3. Для смены см. раздел «Пароль» ниже

## Пароль: где хранить и как менять

### Вариант 1: `admin/config.php` (локально / простой деплой)

Отредактируйте `admin/config.php`:

```php
return [
    'password_hash' => null,
    'password' => 'ваш_новый_пароль',  // plain — только для dev
    'max_login_attempts' => 5,
    'block_duration_minutes' => 30,
];
```

Для продакшена лучше хранить **хеш**, а не plain:

```php
// Сгенерируйте хеш в терминале:
// php -r "echo password_hash('ваш_пароль', PASSWORD_ARGON2ID);"

return [
    'password_hash' => '$argon2id$v=19$m=65536,t=4,p=1$...',  // вставьте сюда
    'password' => null,
    'max_login_attempts' => 5,
    'block_duration_minutes' => 30,
];
```

### Вариант 2: переменные окружения (рекомендуется для прода)

На сервере задайте в `.env` или в настройках хостинга:

```
ADMIN_PASSWORD_HASH=$argon2id$v=19$m=65536,t=4,p=1$...
```

Или plain (менее безопасно):

```
ADMIN_PASSWORD=ваш_сложный_пароль
```

Генерация хеша:

```bash
php -r "echo password_hash('ваш_пароль', PASSWORD_ARGON2ID);"
```

Скопируйте вывод и подставьте в `ADMIN_PASSWORD_HASH` или в `config.php`.

### Смена пароля

1. Сгенерируйте новый хеш: `php -r "echo password_hash('новый_пароль', PASSWORD_ARGON2ID);"`
2. Обновите `config.php` или переменную `ADMIN_PASSWORD_HASH`
3. Перезайдите в админку с новым паролем

## Безопасность (прод)

- **Rate limiting**: 5 неудачных попыток → блок на 30 мин
- **Пароль**: храните хеш в `ADMIN_PASSWORD_HASH` (env)
  - Генерация: `php -r "echo password_hash('ваш_пароль', PASSWORD_ARGON2ID);"`
- **config.php** в `.gitignore` — создайте на сервере из `config.example.php`
- **HTTPS** обязателен в продакшене

## Возможности

- **Dashboard** — счётчики карточек и групп
- **Карточки** — список, фильтры, создание, редактирование
- **Группы** — просмотр
- **Формы** — создание карточек

## CRUD

- Создание: `/admin/card-edit.html`
- Редактирование: `/admin/card-edit.html?slug=xxx`
- API: `POST/PUT/DELETE /api/v1/data` (требуют авторизации)
