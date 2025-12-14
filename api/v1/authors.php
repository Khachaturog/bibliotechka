<?php
/**
 * API эндпоинт для авторов карточки
 * 
 * GET /api/v1/data/{slug}/authors - авторы конкретной карточки
 * GET /api/v1/card-authors?card_slug=... - альтернативный вариант
 */

require_once __DIR__ . '/../config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendError('Method not allowed', 405);
}

// Получаем slug из URL или параметра
$slug = null;

// Вариант 1: /api/v1/data/{slug}/authors
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

if (preg_match('#/data/([^/]+)/authors#', $path, $matches)) {
    $slug = $matches[1];
}

// Вариант 2: /api/v1/card-authors?card_slug=...
if (!$slug && isset($_GET['card_slug'])) {
    $slug = $_GET['card_slug'];
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

