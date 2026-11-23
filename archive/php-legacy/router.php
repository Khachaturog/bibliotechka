<?php
/**
 * Роутер для PHP встроенного сервера
 * Обрабатывает /api/* запросы напрямую через api/index.php
 * Красивые URL для карточек и групп
 * Остальные запросы отдает как статические файлы
 */

/**
 * Логирование для режима разработки
 */
function logRoute($message, $data = []) {
    // Работает только в режиме разработки (localhost или если установлена константа DEBUG_MODE)
    $isDev = ($_SERVER['SERVER_NAME'] ?? '') === 'localhost' 
          || ($_SERVER['SERVER_NAME'] ?? '') === '127.0.0.1'
          || (defined('DEBUG_MODE') && DEBUG_MODE);
    
    if (!$isDev) {
        return;
    }
    
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . '/router.log';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $message";
    
    if (!empty($data)) {
        $logEntry .= ' ' . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    
    $logEntry .= PHP_EOL;
    @file_put_contents($logFile, $logEntry, FILE_APPEND);
}

/**
 * Отдает статический файл с заголовками кэширования
 */
function serveStaticFile($filePath) {
    if (!file_exists($filePath) || !is_file($filePath)) {
        return false;
    }
    
    // Определяем MIME-тип по расширению
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $mimeTypes = [
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'webp' => 'image/webp',
        'ico' => 'image/x-icon',
        'html' => 'text/html',
        'xml' => 'application/xml',
    ];
    
    $mimeType = $mimeTypes[$ext] ?? 'application/octet-stream';
    
    // Получаем время модификации файла
    $lastModified = filemtime($filePath);
    $etag = md5($filePath . $lastModified);
    
    // Проверяем If-None-Match и If-Modified-Since
    $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
    $ifModifiedSince = $_SERVER['HTTP_IF_MODIFIED_SINCE'] ?? '';
    
    if ($ifNoneMatch === $etag || ($ifModifiedSince && strtotime($ifModifiedSince) >= $lastModified)) {
        http_response_code(304);
        header('ETag: ' . $etag);
        header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $lastModified) . ' GMT');
        exit;
    }
    
    // Устанавливаем заголовки кэширования
    header('Content-Type: ' . $mimeType . '; charset=utf-8');
    header('ETag: ' . $etag);
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $lastModified) . ' GMT');
    
    // Кэширование для статических ресурсов
    if (in_array($ext, ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'woff', 'woff2', 'ttf', 'eot'])) {
        header('Cache-Control: public, max-age=31536000, immutable'); // 1 год для статических ресурсов
    } else {
        header('Cache-Control: public, max-age=3600'); // 1 час для HTML и других файлов
    }
    
    return false; // Отдаем файл как есть (PHP сервер сам отдаст)
}

/**
 * Объединенная функция для проверки и отдачи статических файлов
 * Объединяет логику проверки файлов и директорий
 */
function checkAndServeFile($basePath, $requestPath) {
    // Корневой URL → index.php (SSR главная)
    if ($requestPath === '/' || $requestPath === '') {
        $ssrIndex = $basePath . '/index.php';
        if (file_exists($ssrIndex)) {
            return false; // Отдаём PHP-серверу для выполнения как скрипт
        }
        $file = $basePath . '/index.html';
        if (file_exists($file) && is_file($file)) {
            serveStaticFile($file);
            return true;
        }
        return false;
    }
    
    // Проверяем существующий файл
    $file = $basePath . $requestPath;
    if (file_exists($file) && is_file($file)) {
        // Для PHP-файлов отдаём управление встроенному серверу,
        // чтобы они выполнялись, а не скачивались как файлы
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if ($ext === 'php') {
            return false;
        }

        serveStaticFile($file);
        return true;
    }
    
    // Проверяем директорию с index.html
    if (is_dir($file)) {
        $indexFile = $file . '/index.html';
        if (file_exists($indexFile) && is_file($indexFile)) {
            serveStaticFile($indexFile);
            return true;
        }
    }
    
    return false;
}

// Регулярные выражения для роутинга (компилируются один раз)
define('ROUTE_CARD_PATTERN', '#^/card/([a-z0-9-]+)/?$#');
define('ROUTE_GROUP_PATTERN', '#^/([^/]+)/?$#');
define('ROUTE_FILE_EXT_PATTERN', '/\.(html|css|js|php|json|xml|png|jpg|jpeg|gif|svg|webp|ico)$/i');
define('ROUTE_EXCLUDED_PATTERN', '#^/(index\.php|group\.php|detail\.php|about\.php|api|images|css|js|scripts|other|database|data|cache|partials|router\.php|sitemap\.xml|robots\.txt)(/|$)#');

$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$startTime = microtime(true);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Защита админки — проверка авторизации (login и logout не требуют авторизации)
if (strpos($path, '/admin') === 0 && $path !== '/admin/login.php' && $path !== '/admin/logout.php') {
    session_start();
    if (empty($_SESSION['admin_logged_in'])) {
        header('Location: /admin/login.php');
        exit;
    }
}

// Все PHP-файлы внутри /admin/ (login.php, logout.php и т.п.)
// отдаем встроенному PHP-серверу, чтобы они выполнялись как скрипты.
// Это предотвращает 404 от роутера для /admin/login.php.
if (strpos($path, '/admin/') === 0) {
    $adminFile = __DIR__ . $path;
    if (is_file($adminFile) && strtolower(pathinfo($adminFile, PATHINFO_EXTENSION)) === 'php') {
        return false;
    }
}

// Логируем запрос в режиме разработки
logRoute('Request', [
    'method' => $method,
    'path' => $path,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
]);

// sitemap.xml → sitemap.php (динамический, до проверки статических файлов)
if ($path === '/sitemap.xml') {
    require __DIR__ . '/sitemap.php';
    exit;
}

// /about и /about.html → about.php
if ($path === '/about' || $path === '/about.html') {
    require __DIR__ . '/about.php';
    exit;
}

// Оптимизация: сначала проверяем статические файлы (более частые запросы)
// Объединенная проверка файлов и директорий
if (checkAndServeFile(__DIR__, $path)) {
    return false; // Файл найден и отдан
}

// Корневой URL → index.php (SSR главная страница)
if ($path === '/' || $path === '') {
    require __DIR__ . '/index.php';
    exit;
}

// Если запрос к API, обрабатываем напрямую через api/index.php
if (strpos($path, '/api/') === 0) {
    // Проверяем HTTP-метод (API поддерживает только GET)
    if (!in_array($method, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])) {
        logRoute('405 Method Not Allowed', ['method' => $method, 'path' => $path]);
        http_response_code(405);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }
    
    // Убираем /api/ из начала пути
    $apiPath = substr($path, 5); // Убираем '/api/'
    $_GET['path'] = $apiPath;
    logRoute('API Request', ['api_path' => $apiPath]);
    require __DIR__ . '/api/index.php';
    exit;
}

// Проверка исключений для красивых URL групп (только при необходимости)
// Используем регулярное выражение вместо цикла для лучшей производительности
$isExcluded = preg_match(ROUTE_EXCLUDED_PATTERN, $path);

// Обработка красивых URL карточек: /card/url-seo-yandex
if (preg_match(ROUTE_CARD_PATTERN, $path, $matches)) {
    $_GET['url_seo_yandex'] = $matches[1];
    require __DIR__ . '/detail.php';
    exit;
}

// Обработка красивых URL групп: /resource, /designsystem и т.д.
if (!$isExcluded && preg_match(ROUTE_GROUP_PATTERN, $path, $matches)) {
    $slug = $matches[1];
    // Проверяем, что это не файл с расширением
    if (!preg_match(ROUTE_FILE_EXT_PATTERN, $slug)) {
        $_GET['slug'] = $slug;
        require __DIR__ . '/group.php';
        exit;
    }
}

// 404 для несуществующих файлов
$executionTime = round((microtime(true) - $startTime) * 1000, 2);
logRoute('404 Not Found', ['path' => $path, 'time' => $executionTime . 'ms']);
http_response_code(404);
// Если есть 404.php — выполняем его как PHP-скрипт
$notFoundPage = __DIR__ . '/404.php';
if (file_exists($notFoundPage) && is_file($notFoundPage)) {
    require $notFoundPage;
    exit;
}

echo "File not found: " . htmlspecialchars($path);

