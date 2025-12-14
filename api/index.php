<?php
/**
 * API сервер для Библиотечки
 * 
 * Эндпоинты:
 * - GET /api/v1/groups/list - легковесный список групп
 * - GET /api/v1/groups?slug=... - полная группа
 * - GET /api/v1/subgroups - все подгруппы
 * - GET /api/v1/data/list - легковесный список карточек
 * - GET /api/v1/data?slug=... - полная карточка
 * - GET /api/v1/data/{slug}/authors - авторы карточки
 */

require_once __DIR__ . '/config.php';

// Получаем путь запроса
// Путь уже подготовлен в router.php или .htaccess и передан через $_GET['path']
if (isset($_GET['path'])) {
    $apiPath = $_GET['path'];
} else {
    // Fallback: парсим из REQUEST_URI (на случай прямого вызова)
    $requestUri = $_SERVER['REQUEST_URI'];
    $path = parse_url($requestUri, PHP_URL_PATH);
    $apiPath = str_replace(API_BASE_PATH, '', $path);
}

$apiPath = trim($apiPath, '/');

// Убираем префикс v1 если есть
if (strpos($apiPath, 'v1/') === 0) {
    $apiPath = substr($apiPath, 3);
} elseif ($apiPath === 'v1') {
    $apiPath = '';
}

// Разбиваем путь на части
$pathParts = explode('/', $apiPath);
$endpoint = $pathParts[0] ?? '';

// Получаем параметры запроса (исключаем path, так как это часть URL)
$queryParams = $_GET;
unset($queryParams['path']);

// Подключаемся к БД
$db = getDBConnection();

// Роутинг
try {
    switch ($endpoint) {
        case 'groups':
            handleGroups($db, $pathParts, $queryParams);
            break;
            
        case 'subgroups':
            handleSubgroups($db, $queryParams);
            break;
            
        case 'data':
            handleData($db, $pathParts, $queryParams);
            break;
            
        default:
            sendError('Endpoint not found', 404);
    }
} catch (Exception $e) {
    sendError('Internal server error: ' . $e->getMessage(), 500);
}

/**
 * Обработка запросов групп
 */
function handleGroups($db, $pathParts, $queryParams) {
    // GET /api/v1/groups/list - легковесный список
    if (isset($pathParts[1]) && $pathParts[1] === 'list') {
        $sql = "SELECT slug, title_ru, cover, description_ru, sort 
                FROM `groups` 
                ORDER BY sort";
        $stmt = $db->query($sql);
        $results = $stmt->fetchAll();
        sendJSON($results);
    }
    
    // GET /api/v1/groups?slug=... - полная группа
    if (isset($queryParams['slug'])) {
        $sql = "SELECT * FROM `groups` WHERE slug = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([$queryParams['slug']]);
        $results = $stmt->fetchAll();
        sendJSON($results);
    }
    
    sendError('slug parameter required', 400);
}

/**
 * Обработка запросов подгрупп
 */
function handleSubgroups($db, $queryParams) {
    $sql = "SELECT * FROM subgroups ORDER BY title_ru";
    $stmt = $db->query($sql);
    $results = $stmt->fetchAll();
    sendJSON($results);
}

/**
 * Обработка запросов данных (карточек)
 */
function handleData($db, $pathParts, $queryParams) {
    // GET /api/v1/data/{slug}/authors - авторы карточки
    // Путь будет: ['data', 'slug', 'authors']
    if (isset($pathParts[1]) && isset($pathParts[2]) && $pathParts[2] === 'authors') {
        $cardSlug = $pathParts[1];
        $sql = "SELECT a.slug, a.title_ru, a.title_en, a.avatar
                FROM authors a
                INNER JOIN card_authors ca ON a.slug = ca.author_slug
                WHERE ca.card_slug = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([$cardSlug]);
        $results = $stmt->fetchAll();
        sendJSON($results);
        return;
    }
    
    // GET /api/v1/data/list - легковесный список
    if (isset($pathParts[1]) && $pathParts[1] === 'list') {
        $sql = "SELECT slug, title, cover, description, 
                       group_slug, subgroup_slug, status_slug,
                       url_seo_yandex
                FROM data
                WHERE 1=1";
        $params = [];
        
        if (isset($queryParams['status_slug'])) {
            $sql .= " AND status_slug = ?";
            $params[] = $queryParams['status_slug'];
}

        if (isset($queryParams['group_slug'])) {
            $sql .= " AND group_slug = ?";
            $params[] = $queryParams['group_slug'];
        }
        
        $sql .= " ORDER BY slug";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll();
        sendJSON($results);
        return;
    }
    
    // GET /api/v1/data?slug=... - полная карточка
    if (isset($queryParams['slug'])) {
        $sql = "SELECT * FROM data WHERE slug = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([$queryParams['slug']]);
        $results = $stmt->fetchAll();
        sendJSON($results);
        return;
    }
    
    sendError('slug parameter required or use /list endpoint', 400);
}
