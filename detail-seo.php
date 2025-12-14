<?php
/**
 * Скрипт для перенаправления красивых SEO URL карточек
 * Ищет slug по url_seo_yandex и перенаправляет на detail.html?slug=...
 */

require_once __DIR__ . '/api/config.php';

// Получаем url_seo_yandex из параметра
$urlSeoYandex = $_GET['url_seo_yandex'] ?? '';

if (empty($urlSeoYandex)) {
    http_response_code(404);
    echo '<h1>Карточка не найдена</h1>';
    exit;
}

try {
    // Подключаемся к БД
    $db = getDBConnection();
    
    // Ищем карточку по url_seo_yandex
    $sql = "SELECT slug FROM data WHERE url_seo_yandex = ? LIMIT 1";
    $stmt = $db->prepare($sql);
    $stmt->execute([$urlSeoYandex]);
    $result = $stmt->fetch();
    
    if ($result && isset($result['slug'])) {
        // Перенаправляем на detail.html с найденным slug
        header('Location: /detail.html?slug=' . urlencode($result['slug']), true, 301);
        exit;
    } else {
        // Карточка не найдена
        http_response_code(404);
        echo '<h1>Карточка не найдена</h1>';
        echo '<p>URL: ' . htmlspecialchars($urlSeoYandex) . '</p>';
    }
} catch (Exception $e) {
    http_response_code(500);
    echo '<h1>Ошибка сервера</h1>';
    error_log('detail-seo.php error: ' . $e->getMessage());
}

