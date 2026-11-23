<?php
/**
 * API сервер для Библиотечки
 * 
 * Эндпоинты:
 * 
 * Groups:
 * - GET /api/v1/groups/list - легковесный список групп
 * - GET /api/v1/groups?slug=... - полная группа
 * - POST /api/v1/groups - создать группу (требует авторизации)
 * - PUT /api/v1/groups?slug=... - обновить группу (требует авторизации)
 * - DELETE /api/v1/groups?slug=... - удалить группу (требует авторизации)
 * 
 * Subgroups:
 * - GET /api/v1/subgroups - все подгруппы
 * - GET /api/v1/subgroups?group_slug=... - подгруппы группы
 * - GET /api/v1/subgroups?slug=... - одна подгруппа
 * - POST /api/v1/subgroups - создать подгруппу (требует авторизации)
 * - PUT /api/v1/subgroups?slug=... - обновить подгруппу (требует авторизации)
 * - DELETE /api/v1/subgroups?slug=... - удалить подгруппу (требует авторизации)
 * 
 * Data:
 * - GET /api/v1/data/list - легковесный список карточек
 * - GET /api/v1/data?slug=... - полная карточка
 * - GET /api/v1/data/{slug}/authors - авторы карточки
 * - POST /api/v1/data - создать карточку (требует авторизации)
 * - PUT /api/v1/data?slug=... - обновить карточку (требует авторизации)
 * - DELETE /api/v1/data?slug=... - удалить карточку (требует авторизации)
 * 
 * Versions:
 * - GET /api/v1/versions/list - список версий (changelog)
 * - GET /api/v1/versions?slug=... - одна версия
 * - POST /api/v1/versions - создать версию (требует авторизации)
 * - PUT /api/v1/versions?slug=... - обновить версию (требует авторизации)
 * - DELETE /api/v1/versions?slug=... - удалить версию (требует авторизации)
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../admin/auth.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

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
            handleGroups($db, $pathParts, $queryParams, $method);
            break;
            
        case 'subgroups':
            handleSubgroups($db, $pathParts, $queryParams, $method);
            break;
            
        case 'data':
            handleData($db, $pathParts, $queryParams, $method);
            break;
        
        case 'versions':
            handleVersions($db, $pathParts, $queryParams, $method);
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
function handleGroups($db, $pathParts, $queryParams, $method = 'GET') {
    // GET /api/v1/groups/list - легковесный список
    if (isset($pathParts[1]) && $pathParts[1] === 'list') {
        $sql = "SELECT slug, title_ru, cover, description_ru, sort 
                FROM `groups` 
                ORDER BY sort";
        $stmt = $db->query($sql);
        $results = $stmt->fetchAll();
        sendJSON($results, 200, 3600);
        return;
    }
    
    // POST /api/v1/groups - создать группу
    if ($method === 'POST') {
        requireAdminAuth();
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        if (empty($input['slug']) || empty($input['title_ru'])) {
            sendError('slug and title_ru required', 400);
        }
        $slug = $input['slug'];
        $stmt = $db->prepare("SELECT 1 FROM `groups` WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->fetch()) {
            sendError('Group with this slug already exists', 409);
        }
        $fields = [
            'slug', 'title_ru', 'title_en', 'badge', 'cover', 'description_ru',
            'description_seo', 'keywords_seo', 'og_description', 'og_image', 'og_title',
            'sort', 'title_seo', 'created_at', 'updated_at'
        ];
        $cols = [];
        $placeholders = [];
        $vals = [];
        foreach ($fields as $f) {
            if (array_key_exists($f, $input)) {
                $cols[] = "`$f`";
                $placeholders[] = '?';
                $vals[] = $input[$f] ?? null;
            }
        }
        // groups table uses created_at/updated_at with DEFAULT CURRENT_TIMESTAMP
        $sql = "INSERT INTO `groups` (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $db->prepare($sql);
        $stmt->execute($vals);
        sendJSON(['ok' => true, 'slug' => $slug], 201, 0);
        return;
    }
    
    // PUT/PATCH /api/v1/groups?slug=... - обновить группу
    if ($method === 'PUT' || $method === 'PATCH') {
        requireAdminAuth();
        $slug = $queryParams['slug'] ?? null;
        if (!$slug) sendError('slug parameter required', 400);
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $stmt = $db->prepare("SELECT 1 FROM `groups` WHERE slug = ?");
        $stmt->execute([$slug]);
        if (!$stmt->fetch()) {
            sendError('Group not found', 404);
        }
        $fields = [
            'title_ru', 'title_en', 'badge', 'cover', 'description_ru',
            'description_seo', 'keywords_seo', 'og_description', 'og_image', 'og_title',
            'sort', 'title_seo', 'created_at', 'updated_at'
        ];
        $sets = [];
        $vals = [];
        foreach ($fields as $f) {
            if (array_key_exists($f, $input)) {
                $sets[] = "`$f` = ?";
                $vals[] = $input[$f] ?? null;
            }
        }
        if (empty($sets)) {
            sendError('No fields to update', 400);
        }
        // groups table uses updated_at with ON UPDATE CURRENT_TIMESTAMP
        $vals[] = $slug;
        $sql = "UPDATE `groups` SET " . implode(', ', $sets) . " WHERE slug = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($vals);
        sendJSON(['ok' => true, 'slug' => $slug], 200, 0);
        return;
    }
    
    // DELETE /api/v1/groups?slug=... - удалить группу
    if ($method === 'DELETE') {
        requireAdminAuth();
        $slug = $queryParams['slug'] ?? null;
        if (!$slug) sendError('slug parameter required', 400);
        $stmt = $db->prepare("DELETE FROM `groups` WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->rowCount() === 0) {
            sendError('Group not found', 404);
        }
        sendJSON(['ok' => true], 200, 0);
        return;
    }
    
    // GET /api/v1/groups?slug=... - полная группа
    if (isset($queryParams['slug'])) {
        $sql = "SELECT * FROM `groups` WHERE slug = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([$queryParams['slug']]);
        $results = $stmt->fetchAll();
        sendJSON($results, 200, 3600);
        return;
    }
    
    sendError('slug parameter required', 400);
}

/**
 * Обработка запросов подгрупп
 */
function handleSubgroups($db, $pathParts, $queryParams, $method = 'GET') {
    // POST /api/v1/subgroups - создать подгруппу
    if ($method === 'POST') {
        requireAdminAuth();
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        if (empty($input['slug']) || empty($input['group_slug'])) {
            sendError('slug and group_slug required', 400);
        }
        $slug = $input['slug'];
        $stmt = $db->prepare("SELECT 1 FROM subgroups WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->fetch()) {
            sendError('Subgroup with this slug already exists', 409);
        }
        $fields = [
            'slug', 'title_ru', 'title_en', 'description_ru', 'status', 'group_slug',
            'sort', 'created_at', 'updated_at'
        ];
        $cols = [];
        $placeholders = [];
        $vals = [];
        foreach ($fields as $f) {
            if (array_key_exists($f, $input)) {
                $cols[] = "`$f`";
                $placeholders[] = '?';
                $vals[] = $input[$f] ?? null;
            }
        }
        // subgroups table uses created_at/updated_at with DEFAULT CURRENT_TIMESTAMP
        $sql = "INSERT INTO subgroups (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $db->prepare($sql);
        $stmt->execute($vals);
        sendJSON(['ok' => true, 'slug' => $slug], 201, 0);
        return;
    }
    
    // PUT/PATCH /api/v1/subgroups?slug=... - обновить подгруппу
    if ($method === 'PUT' || $method === 'PATCH') {
        requireAdminAuth();
        $slug = $queryParams['slug'] ?? null;
        if (!$slug) sendError('slug parameter required', 400);
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $stmt = $db->prepare("SELECT 1 FROM subgroups WHERE slug = ?");
        $stmt->execute([$slug]);
        if (!$stmt->fetch()) {
            sendError('Subgroup not found', 404);
        }
        $fields = [
            'title_ru', 'title_en', 'description_ru', 'status', 'group_slug',
            'sort', 'created_at', 'updated_at'
        ];
        $sets = [];
        $vals = [];
        foreach ($fields as $f) {
            if (array_key_exists($f, $input)) {
                $sets[] = "`$f` = ?";
                $vals[] = $input[$f] ?? null;
            }
        }
        if (empty($sets)) {
            sendError('No fields to update', 400);
        }
        // subgroups table uses updated_at with ON UPDATE CURRENT_TIMESTAMP
        $vals[] = $slug;
        $sql = "UPDATE subgroups SET " . implode(', ', $sets) . " WHERE slug = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($vals);
        sendJSON(['ok' => true, 'slug' => $slug], 200, 0);
        return;
    }
    
    // DELETE /api/v1/subgroups?slug=... - удалить подгруппу
    if ($method === 'DELETE') {
        requireAdminAuth();
        $slug = $queryParams['slug'] ?? null;
        if (!$slug) sendError('slug parameter required', 400);
        $stmt = $db->prepare("DELETE FROM subgroups WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->rowCount() === 0) {
            sendError('Subgroup not found', 404);
        }
        sendJSON(['ok' => true], 200, 0);
        return;
    }
    
    // GET /api/v1/subgroups?slug=... - одна подгруппа (для формы редактирования)
    if (isset($queryParams['slug'])) {
        $sql = "SELECT * FROM subgroups WHERE slug = ? LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute([$queryParams['slug']]);
        $row = $stmt->fetch();
        if (!$row) {
            sendError('Subgroup not found', 404);
        }
        sendJSON($row, 200, 0);
        return;
    }
    
    // GET /api/v1/subgroups?group_slug=... - подгруппы группы
    if (isset($queryParams['group_slug'])) {
        $sql = "SELECT * FROM subgroups WHERE group_slug = ? ORDER BY sort";
        $stmt = $db->prepare($sql);
        $stmt->execute([$queryParams['group_slug']]);
        $results = $stmt->fetchAll();
        sendJSON($results, 200, 3600);
        return;
    }
    
    // GET /api/v1/subgroups - все подгруппы
    $sql = "SELECT * FROM subgroups ORDER BY sort, title_ru";
    $stmt = $db->query($sql);
    $results = $stmt->fetchAll();
    sendJSON($results, 200, 3600);
}

/**
 * Обработка запросов данных (карточек)
 */
function handleData($db, $pathParts, $queryParams, $method = 'GET') {
    $isAdmin = isAdminLoggedIn();

    // POST /api/v1/data - создать карточку
    if ($method === 'POST') {
        requireAdminAuth();
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        if (empty($input['slug']) || empty($input['title'])) {
            sendError('slug and title required', 400);
        }
        $slug = $input['slug'];
        $stmt = $db->prepare("SELECT 1 FROM data WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->fetch()) {
            sendError('Card with this slug already exists', 409);
        }
        // Разрешенные к записи поля карточки (без служебных created_at_db/updated_at_db)
        $fields = [
            'slug',
            'title',
            'cover_short',
            'cover_large',
            'url_seo_yandex',
            'url_seo_google',
            'description',
            'author_slug',
            'status_slug',
            'group_slug',
            'subgroup_slug',
            'url_title_1',
            'url_1',
            'url_title_2',
            'url_2',
            'url_title_3',
            'url_3',
            'url_title_4',
            'url_4',
            'url_title_5',
            'url_5',
            'url_title_6',
            'url_6',
            'start_date',
            'end_date',
            'published',
            'created_at',
            'updated_at',
            'summary_ai',
            'detail',
            'comment',
            'version_slug'
        ];
        $cols = [];
        $placeholders = [];
        $vals = [];
        foreach ($fields as $f) {
            if (array_key_exists($f, $input)) {
                $cols[] = "`$f`";
                $placeholders[] = '?';
                $vals[] = $input[$f] ?? null;
            }
        }
        $cols[] = 'created_at_db';
        $placeholders[] = 'CURRENT_TIMESTAMP';
        $sql = "INSERT INTO data (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $db->prepare($sql);
        $stmt->execute($vals);
        sendJSON(['ok' => true, 'slug' => $slug], 201, 0);
        return;
    }

    // PUT /api/v1/data?slug=... - обновить карточку
    if ($method === 'PUT' || $method === 'PATCH') {
        requireAdminAuth();
        $slug = $queryParams['slug'] ?? null;
        if (!$slug) sendError('slug parameter required', 400);
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $stmt = $db->prepare("SELECT 1 FROM data WHERE slug = ?");
        $stmt->execute([$slug]);
        if (!$stmt->fetch()) {
            sendError('Card not found', 404);
        }
        // Разрешенные к обновлению поля (slug и created_at_db/updated_at_db не трогаем)
        $fields = [
            'title',
            'cover_short',
            'cover_large',
            'url_seo_yandex',
            'url_seo_google',
            'description',
            'author_slug',
            'status_slug',
            'group_slug',
            'subgroup_slug',
            'url_title_1',
            'url_1',
            'url_title_2',
            'url_2',
            'url_title_3',
            'url_3',
            'url_title_4',
            'url_4',
            'url_title_5',
            'url_5',
            'url_title_6',
            'url_6',
            'start_date',
            'end_date',
            'published',
            'created_at',
            'updated_at',
            'summary_ai',
            'detail',
            'comment',
            'version_slug'
        ];
        $sets = [];
        $vals = [];
        foreach ($fields as $f) {
            if (array_key_exists($f, $input)) {
                $sets[] = "`$f` = ?";
                $vals[] = $input[$f] ?? null;
            }
        }
        if (empty($sets)) {
            sendError('No fields to update', 400);
        }
        $vals[] = $slug;
        $sql = "UPDATE data SET " . implode(', ', $sets) . " WHERE slug = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($vals);
        sendJSON(['ok' => true, 'slug' => $slug], 200, 0);
        return;
    }

    // DELETE /api/v1/data?slug=... - удалить карточку
    if ($method === 'DELETE') {
        requireAdminAuth();
        $slug = $queryParams['slug'] ?? null;
        if (!$slug) sendError('slug parameter required', 400);
        $stmt = $db->prepare("DELETE FROM data WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->rowCount() === 0) {
            sendError('Card not found', 404);
        }
        sendJSON(['ok' => true], 200, 0);
        return;
    }

    // GET /api/v1/data/{slug}/authors - авторы карточки
    // Путь будет: ['data', 'slug', 'authors']
    if (isset($pathParts[1]) && isset($pathParts[2]) && $pathParts[2] === 'authors') {
        $cardSlug = $pathParts[1];
        $sql = "SELECT a.slug, a.title_ru, a.title_en, a.avatar
                FROM authors a
                INNER JOIN card_authors ca ON a.slug = ca.author_slug
                WHERE ca.card_slug = ?
                ORDER BY a.title_ru";
        $stmt = $db->prepare($sql);
        $stmt->execute([$cardSlug]);
        $results = $stmt->fetchAll();
        // Авторы меняются редко - кэшируем на 1 час
        sendJSON($results, 200, 3600);
        return;
    }
    
    // GET /api/v1/data/list - легковесный список
    if (isset($pathParts[1]) && $pathParts[1] === 'list') {
        $sql = "SELECT slug, title, cover_short, description, 
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
        // Список карточек - кэшируем на 5 минут
        sendJSON($results, 200, 300);
        return;
    }
    
    // GET /api/v1/data?slug=... - полная карточка по slug
    // Админ видит любую карточку, публичный API — только published
    if (isset($queryParams['slug'])) {
        $statusFilter = $isAdmin ? '' : " AND status_slug = 'published'";
        $sql = "SELECT * FROM data WHERE slug = ?" . $statusFilter . " LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute([$queryParams['slug']]);
        $results = $stmt->fetchAll();
        if (empty($results)) {
            sendError('Card not found', 404);
            return;
        }
        sendJSON($results, 200, $isAdmin ? 0 : 3600);
        return;
    }
    
    if (isset($queryParams['url_seo_yandex'])) {
        $statusFilter = $isAdmin ? '' : " AND status_slug = 'published'";
        $sql = "SELECT * FROM data WHERE url_seo_yandex = ?" . $statusFilter . " LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute([$queryParams['url_seo_yandex']]);
        $results = $stmt->fetchAll();
        if (empty($results)) {
            sendError('Card not found', 404);
            return;
        }
        sendJSON($results, 200, $isAdmin ? 0 : 3600);
        return;
    }
    
    sendError('slug or url_seo_yandex parameter required or use /list endpoint', 400);
}

/**
 * Обработка запросов версий проекта (changelog)
 */
function handleVersions($db, $pathParts, $queryParams, $method = 'GET') {
    // GET /api/v1/versions/list — список всех версий
    if (isset($pathParts[1]) && $pathParts[1] === 'list') {
        $sql = "SELECT slug, version, title, description, release_date, url
                FROM versions
                ORDER BY COALESCE(STR_TO_DATE(release_date, '%M %e, %Y'), release_date) DESC, slug DESC";
        $stmt = $db->query($sql);
        $results = $stmt->fetchAll();
        sendJSON($results, 200, 3600);
        return;
    }
    
    // POST /api/v1/versions - создать версию
    if ($method === 'POST') {
        requireAdminAuth();
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        if (empty($input['slug']) || empty($input['version'])) {
            sendError('slug and version required', 400);
        }
        $slug = $input['slug'];
        $stmt = $db->prepare("SELECT 1 FROM versions WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->fetch()) {
            sendError('Version with this slug already exists', 409);
        }
        $fields = ['slug', 'version', 'title', 'description', 'release_date', 'url'];
        $cols = [];
        $placeholders = [];
        $vals = [];
        foreach ($fields as $f) {
            if (array_key_exists($f, $input)) {
                $cols[] = "`$f`";
                $placeholders[] = '?';
                $vals[] = $input[$f] ?? null;
            }
        }
        $cols[] = 'created_at_db';
        $placeholders[] = 'CURRENT_TIMESTAMP';
        $sql = "INSERT INTO versions (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $db->prepare($sql);
        $stmt->execute($vals);
        sendJSON(['ok' => true, 'slug' => $slug], 201, 0);
        return;
    }
    
    // PUT/PATCH /api/v1/versions?slug=... - обновить версию
    if ($method === 'PUT' || $method === 'PATCH') {
        requireAdminAuth();
        $slug = $queryParams['slug'] ?? null;
        if (!$slug) sendError('slug parameter required', 400);
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $stmt = $db->prepare("SELECT 1 FROM versions WHERE slug = ?");
        $stmt->execute([$slug]);
        if (!$stmt->fetch()) {
            sendError('Version not found', 404);
        }
        $fields = ['version', 'title', 'description', 'release_date', 'url'];
        $sets = [];
        $vals = [];
        foreach ($fields as $f) {
            if (array_key_exists($f, $input)) {
                $sets[] = "`$f` = ?";
                $vals[] = $input[$f] ?? null;
            }
        }
        if (empty($sets)) {
            sendError('No fields to update', 400);
        }
        $sets[] = 'updated_at_db = CURRENT_TIMESTAMP';
        $vals[] = $slug;
        $sql = "UPDATE versions SET " . implode(', ', $sets) . " WHERE slug = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($vals);
        sendJSON(['ok' => true, 'slug' => $slug], 200, 0);
        return;
    }
    
    // DELETE /api/v1/versions?slug=... - удалить версию
    if ($method === 'DELETE') {
        requireAdminAuth();
        $slug = $queryParams['slug'] ?? null;
        if (!$slug) sendError('slug parameter required', 400);
        $stmt = $db->prepare("DELETE FROM versions WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->rowCount() === 0) {
            sendError('Version not found', 404);
        }
        sendJSON(['ok' => true], 200, 0);
        return;
    }
    
    // GET /api/v1/versions?slug=... - одна версия (для формы)
    if (isset($queryParams['slug'])) {
        $sql = "SELECT * FROM versions WHERE slug = ? LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute([$queryParams['slug']]);
        $row = $stmt->fetch();
        if (!$row) {
            sendError('Version not found', 404);
        }
        sendJSON($row, 200, 0);
        return;
    }
    
    sendError('slug parameter required or use /versions/list', 400);
}
