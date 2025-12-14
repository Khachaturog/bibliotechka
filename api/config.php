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
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $conn = new PDO($dsn, DB_USER, DB_PASSWORD, $options);
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

// Функция для отправки JSON ответа
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Функция для отправки ошибки
function sendError($message, $statusCode = 400) {
    sendJSON(['error' => $message], $statusCode);
}
