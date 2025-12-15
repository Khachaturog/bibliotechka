<?php
/**
 * API эндпоинт: GET /api/v1/subgroups
 * Все подгруппы
 */

require_once __DIR__ . '/../../config.php';

try {
    $pdo = getDBConnection();
    
    $query = "SELECT * FROM subgroups ORDER BY title_ru";
    $stmt = $pdo->query($query);
    $subgroups = $stmt->fetchAll();
    
    sendJSON($subgroups);
} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
}

