<?php
/**
 * API эндпоинт для подгрупп (Subgroups)
 * 
 * GET /api/v1/subgroups - все подгруппы
 * GET /api/v1/subgroups?group_slug=... - подгруппы конкретной группы
 */

require_once __DIR__ . '/../config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendError('Method not allowed', 405);
}

try {
    if (isset($_GET['group_slug']) && !empty($_GET['group_slug'])) {
        // Подгруппы конкретной группы
        $groupSlug = $_GET['group_slug'];
        $query = "
            SELECT DISTINCT s.* 
            FROM subgroups s
            INNER JOIN data d ON s.slug = d.subgroup_slug
            WHERE d.group_slug = ?
            ORDER BY s.title_ru
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([$groupSlug]);
    } else {
        // Все подгруппы
        $query = "SELECT * FROM subgroups ORDER BY title_ru";
        $stmt = $pdo->query($query);
    }
    
    $subgroups = $stmt->fetchAll();
    
    // Преобразуем title_ru в title для совместимости
    foreach ($subgroups as &$subgroup) {
        $subgroup['title'] = $subgroup['title_ru'];
        $subgroup['description'] = $subgroup['description_ru'] ?? '';
    }
    
    sendJSON($subgroups);
} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
}

