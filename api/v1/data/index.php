<?php
/**
 * API эндпоинт: GET /api/v1/data?slug=...
 * Полная карточка по slug
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
} else {
    sendError('slug parameter is required', 400);
}

