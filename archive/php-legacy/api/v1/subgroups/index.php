<?php
/**
 * API эндпоинт: GET /api/v1/subgroups
 * Все подгруппы
 * 
 * Если указан параметр group_slug - возвращает подгруппы конкретной группы, отсортированные по sort
 * Если не указан - возвращает все подгруппы, отсортированные по title_ru
 */

require_once __DIR__ . '/../../config.php';

try {
    $pdo = getDBConnection();
    
    // Если указан group_slug, фильтруем и сортируем по sort (для group.html)
    if (isset($_GET['group_slug'])) {
        $query = "SELECT * FROM subgroups WHERE group_slug = ? ORDER BY sort";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$_GET['group_slug']]);
        $subgroups = $stmt->fetchAll();
    } else {
        // Если не указан group_slug, возвращаем все (для index.html и других страниц)
        $query = "SELECT * FROM subgroups ORDER BY title_ru";
        $stmt = $pdo->query($query);
        $subgroups = $stmt->fetchAll();
    }
    
    sendJSON($subgroups);
} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
}

