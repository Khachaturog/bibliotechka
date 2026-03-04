<?php
/**
 * API эндпоинт: GET /api/v1/data?slug=... или GET /api/v1/data?url_seo_yandex=...
 * Полная карточка по slug или url_seo_yandex
 */

require_once __DIR__ . '/../../config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendError('Method not allowed', 405);
}

// Полная карточка по slug
if (isset($_GET['slug'])) {
    $slug = $_GET['slug'];
    
    if (empty($slug)) {
        sendError('slug parameter is required', 400);
    }
    
    try {
        $query = "SELECT * FROM data WHERE slug = ? AND status_slug = 'published' LIMIT 1";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$slug]);
        $card = $stmt->fetch();
        
        if (!$card) {
            sendError('Card not found', 404);
        }
        
        // Отдельная карточка - кэшируем на 1 час
        sendJSON([$card], 200, 3600);
    } catch (PDOException $e) {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
    return;
}

// Полная карточка по url_seo_yandex (для красивых URL)
if (isset($_GET['url_seo_yandex'])) {
    $urlSeoYandex = $_GET['url_seo_yandex'];
    
    if (empty($urlSeoYandex)) {
        sendError('url_seo_yandex parameter is required', 400);
    }
    
    try {
        $query = "SELECT * FROM data WHERE url_seo_yandex = ? AND status_slug = 'published' LIMIT 1";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$urlSeoYandex]);
        $card = $stmt->fetch();
        
        if (!$card) {
            sendError('Card not found', 404);
        }
        
        // Отдельная карточка - кэшируем на 1 час
        sendJSON([$card], 200, 3600);
    } catch (PDOException $e) {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
    return;
}

// Если ни slug, ни url_seo_yandex не указаны
sendError('slug or url_seo_yandex parameter is required', 400);

