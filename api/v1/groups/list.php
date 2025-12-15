<?php
/**
 * API эндпоинт: GET /api/v1/groups/list
 * Легковесный список групп
 */

require_once __DIR__ . '/../../config.php';

try {
    $pdo = getDBConnection();
    
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

