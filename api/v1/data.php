<?php
/**
 * API эндпоинт для карточек/данных (Data)
 * 
 * GET /api/v1/data/list - легковесный список карточек
 * GET /api/v1/data?slug=... - полная карточка по slug
 */

require_once __DIR__ . '/../config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendError('Method not allowed', 405);
}

// Проверяем путь запроса
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Легковесный список карточек
if (strpos($path, '/data/list') !== false || (strpos($path, '/data') !== false && !isset($_GET['slug']))) {
    try {
        $query = "
            SELECT 
                slug,
                title,
                cover,
                description,
                group_slug,
                subgroup_slug,
                status_slug,
                url_seo_yandex
            FROM data
            WHERE 1=1
        ";
        
        $params = [];
        
        // Фильтр по статусу
        if (isset($_GET['status_slug']) && !empty($_GET['status_slug'])) {
            $query .= " AND status_slug = ?";
            $params[] = $_GET['status_slug'];
        }
        
        // Фильтр по группе
        if (isset($_GET['group_slug']) && !empty($_GET['group_slug'])) {
            $query .= " AND group_slug = ?";
            $params[] = $_GET['group_slug'];
        }
        
        $query .= " ORDER BY slug";
        
        if (!empty($params)) {
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
        } else {
            $stmt = $pdo->query($query);
        }
        
        $data = $stmt->fetchAll();
        sendJSON($data);
    } catch (PDOException $e) {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
}

// Полная карточка по slug
if (isset($_GET['slug'])) {
    $slug = $_GET['slug'];
    
    if (empty($slug)) {
        sendError('slug parameter is required', 400);
    }
    
    try {
        $query = "SELECT * FROM data WHERE slug = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$slug]);
        $card = $stmt->fetch();
        
        if (!$card) {
            sendError('Card not found', 404);
        }
        
        sendJSON([$card]);
    } catch (PDOException $e) {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
}

sendError('Invalid request', 400);

