<?php
/**
 * Скрипт для тестирования подключения к БД на продакшене
 * 
 * Использование: откройте в браузере https://ваш-домен.ru/api/test-connection.php
 * После проверки УДАЛИТЕ этот файл из соображений безопасности!
 */

require_once __DIR__ . '/config.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h1>Тест подключения к базе данных</h1>";

// Тест 1: Подключение к БД
echo "<h2>1. Тест подключения к БД</h2>";
try {
    $pdo = getDBConnection();
    echo "<p style='color: green;'>✓ Подключение к БД успешно!</p>";
    echo "<p>Хост: " . DB_HOST . "</p>";
    echo "<p>База данных: " . DB_NAME . "</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Ошибка подключения: " . htmlspecialchars($e->getMessage()) . "</p>";
    exit;
}

// Тест 2: Проверка таблиц
echo "<h2>2. Проверка таблиц</h2>";
$tables = ['groups', 'data', 'subgroups', 'authors', 'card_authors'];
foreach ($tables as $table) {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
        $result = $stmt->fetch();
        echo "<p>Таблица <strong>$table</strong>: " . $result['count'] . " записей</p>";
    } catch (Exception $e) {
        echo "<p style='color: red;'>✗ Ошибка в таблице <strong>$table</strong>: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
}

// Тест 3: Проверка API эндпоинтов
echo "<h2>3. Тест API эндпоинтов</h2>";

// Тест groups/list
echo "<h3>3.1. GET /api/v1/groups/list</h3>";
try {
    $stmt = $pdo->query("SELECT slug, title_ru, cover, description_ru, sort FROM `groups` ORDER BY sort LIMIT 5");
    $groups = $stmt->fetchAll();
    echo "<p style='color: green;'>✓ Запрос выполнен успешно. Найдено групп: " . count($groups) . "</p>";
    if (count($groups) > 0) {
        echo "<pre>" . print_r($groups[0], true) . "</pre>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Ошибка: " . htmlspecialchars($e->getMessage()) . "</p>";
}

// Тест data/list
echo "<h3>3.2. GET /api/v1/data/list</h3>";
try {
    $stmt = $pdo->query("SELECT slug, title, cover, description, group_slug, subgroup_slug, status_slug, url_seo_yandex FROM data WHERE status_slug = 'published' LIMIT 5");
    $data = $stmt->fetchAll();
    echo "<p style='color: green;'>✓ Запрос выполнен успешно. Найдено карточек: " . count($data) . "</p>";
    if (count($data) > 0) {
        echo "<pre>" . print_r($data[0], true) . "</pre>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Ошибка: " . htmlspecialchars($e->getMessage()) . "</p>";
}

// Тест 4: Информация о сервере
echo "<h2>4. Информация о сервере</h2>";
echo "<p>PHP версия: " . phpversion() . "</p>";
echo "<p>Сервер: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'неизвестно') . "</p>";
echo "<p>REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'неизвестно') . "</p>";
echo "<p>DOCUMENT_ROOT: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'неизвестно') . "</p>";

echo "<hr>";
echo "<p style='color: red;'><strong>ВАЖНО: После проверки удалите этот файл (api/test-connection.php) из соображений безопасности!</strong></p>";

