<?php
/**
 * Конфигурация подключения к базе данных
 * 
 * Используется единая база данных на сервере
 */

// Настройки подключения к БД на сервере
define('DB_HOST', 'mysql.35401aca832c.hosting.myjino.ru');
define('DB_PORT', '3306');
define('DB_USER', 'j35045845_biblio');
define('DB_PASSWORD', 'tuhrih-zoqmYp');
define('DB_NAME', 'j35045845_biblio');

// Настройки API
define('API_VERSION', 'v1');
define('API_BASE_PATH', '/api/' . API_VERSION);

// Функция для подключения к БД
function getDBConnection() {
    static $conn = null;
    
    if ($conn === null) {
        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                DB_HOST,
                DB_PORT,
                DB_NAME
            );
            
            // PDO::MYSQL_ATTR_INIT_COMMAND deprecated начиная с PHP 8.5.
            // В новых версиях нужно использовать Pdo\Mysql::ATTR_INIT_COMMAND.
            $mysqlInitAttr = null;
            if (class_exists('Pdo\\Mysql') && defined('Pdo\\Mysql::ATTR_INIT_COMMAND')) {
                $mysqlInitAttr = \Pdo\Mysql::ATTR_INIT_COMMAND;
            } elseif (defined('PDO::MYSQL_ATTR_INIT_COMMAND')) {
                $mysqlInitAttr = PDO::MYSQL_ATTR_INIT_COMMAND;
            }

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                // Оптимизация производительности
                PDO::ATTR_PERSISTENT => false, // Не используем постоянные соединения (могут вызывать проблемы)
            ];
            if ($mysqlInitAttr !== null) {
                $options[$mysqlInitAttr] = "SET NAMES utf8mb4, sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'";
            }
            
            // Таймаут подключения через ini_set (работает глобально)
            ini_set('default_socket_timeout', 5);
            
            $conn = new PDO($dsn, DB_USER, DB_PASSWORD, $options);
            
            // Дополнительные настройки для производительности
            $conn->exec("SET SESSION query_cache_type = OFF"); // Отключаем query cache на уровне сессии
            $conn->exec("SET SESSION innodb_lock_wait_timeout = 5"); // Таймаут ожидания блокировок
        } catch (PDOException $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'error' => 'Database connection failed',
                'message' => $e->getMessage()
            ]);
            exit;
        }
    }
    
    return $conn;
}

// Функция для отправки JSON ответа с кэшированием и компрессией
function sendJSON($data, $statusCode = 200, $cacheSeconds = 300) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    
    // Кодируем JSON один раз для всех операций
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
    // Кэширование (0 = не кэшировать для ответов на запись)
    header('Cache-Control: ' . ($cacheSeconds > 0 ? 'public, max-age=' . $cacheSeconds : 'no-store, no-cache'));
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + $cacheSeconds) . ' GMT');
    
    // ETag для валидации кэша
    $etag = md5($json);
    header('ETag: "' . $etag . '"');
    
    // Проверяем If-None-Match (304 Not Modified)
    $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
    if ($ifNoneMatch === '"' . $etag . '"') {
        http_response_code(304);
        exit;
    }
    
    // Компрессия ответа (gzip) - только если поддерживается И не на localhost
    // Отключаем для localhost, так как встроенный PHP сервер может конфликтовать
    $isLocalhost = ($_SERVER['SERVER_NAME'] ?? '') === 'localhost' 
                || ($_SERVER['SERVER_NAME'] ?? '') === '127.0.0.1'
                || strpos($_SERVER['SERVER_NAME'] ?? '', '.local') !== false;
    
    if (!$isLocalhost && extension_loaded('zlib') && isset($_SERVER['HTTP_ACCEPT_ENCODING']) && 
        strpos($_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip') !== false) {
        // Отключаем output buffering перед сжатием (если включен)
        if (ob_get_level()) {
            ob_end_clean();
        }
        header('Content-Encoding: gzip');
        header('Vary: Accept-Encoding');
        echo gzencode($json, 6); // уровень сжатия 6 (баланс скорость/размер)
    } else {
        echo $json;
    }
    exit;
}

// Функция для отправки ошибки
function sendError($message, $statusCode = 400) {
    sendJSON(['error' => $message], $statusCode);
}
