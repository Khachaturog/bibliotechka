<?php
/**
 * API эндпоинт: GET /api/v1/groups?slug=...
 * Полная группа по slug
 */

require_once __DIR__ . '/../../config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendError('Method not allowed', 405);
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
} else {
    sendError('slug parameter is required', 400);
}

