<?php
/**
 * API эндпоинт: GET /api/v1/data/list
 * Легковесный список карточек
 */

require_once __DIR__ . '/../../config.php';

try {
    $pdo = getDBConnection();
    
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

