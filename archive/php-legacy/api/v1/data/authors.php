<?php
/**
 * API эндпоинт: GET /api/v1/data/{slug}/authors
 * Авторы конкретной карточки
 * 
 * Также поддерживает: GET /api/v1/data/authors.php?slug=...
 */

require_once __DIR__ . '/../../config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendError('Method not allowed', 405);
}

// Получаем slug из параметра или из пути URL
$slug = null;

// Вариант 1: из параметра
if (isset($_GET['slug'])) {
    $slug = $_GET['slug'];
}

// Вариант 2: из пути URL (/api/v1/data/{slug}/authors)
if (!$slug) {
    $requestUri = $_SERVER['REQUEST_URI'];
    $path = parse_url($requestUri, PHP_URL_PATH);
    
    // Пытаемся извлечь slug из пути
    // Формат: /api/v1/data/{slug}/authors
    if (preg_match('#/data/([^/]+)/authors#', $path, $matches)) {
        $slug = $matches[1];
    }
}

if (empty($slug)) {
    sendError('slug parameter is required', 400);
}

try {
    $query = "
        SELECT 
            a.slug,
            a.title_ru,
            a.title_en,
            a.avatar
        FROM authors a
        INNER JOIN card_authors ca ON a.slug = ca.author_slug
        WHERE ca.card_slug = ?
        ORDER BY a.title_ru
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$slug]);
    $authors = $stmt->fetchAll();
    
    sendJSON($authors);
} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
}

