<?php
/**
 * API эндпоинт для групп (Groups)
 * 
 * GET /api/v1/groups/list - легковесный список групп
 * GET /api/v1/groups?slug=... - полная группа по slug
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

// Легковесный список групп
if (strpos($path, '/groups/list') !== false) {
    try {
        $query = "
            SELECT 
                slug,
                title_ru,
                cover,
                description_ru,
                sort
            FROM `groups`
            ORDER BY sort
        ";
        
        $stmt = $pdo->query($query);
        $groups = $stmt->fetchAll();
        
        // Преобразуем title_ru в title для совместимости со старым кодом
        foreach ($groups as &$group) {
            $group['title'] = $group['title_ru'];
            $group['description'] = $group['description_ru'];
        }
        
        sendJSON($groups);
    } catch (PDOException $e) {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
}

// Полная группа по slug
if (isset($_GET['slug'])) {
    $slug = $_GET['slug'];
    
    if (empty($slug)) {
        sendError('slug parameter is required', 400);
    }
    
    try {
        $query = "SELECT * FROM `groups` WHERE slug = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$slug]);
        $group = $stmt->fetch();
        
        if (!$group) {
            sendError('Group not found', 404);
        }
        
        // Преобразуем title_ru в title для совместимости
        $group['title'] = $group['title_ru'];
        $group['description'] = $group['description_ru'];
        
        sendJSON([$group]);
    } catch (PDOException $e) {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
}

sendError('Invalid request', 400);

