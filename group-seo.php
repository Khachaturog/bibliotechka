<?php
/**
 * Скрипт для обработки красивых URL групп: /{slug}
 *
 * Задача:
 * - если группа существует в БД: отдать group.html (без редиректа)
 * - если группы нет: отдать 404.html со статусом 404 (чтобы реально был 404, а не 200)
 */

require_once __DIR__ . '/api/config.php';

function groupSeoE($value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$slug = $_GET['slug'] ?? null;
if (!$slug || !is_string($slug) || !preg_match('/^[a-z0-9-]+$/', $slug)) {
    http_response_code(404);
    $notFound = __DIR__ . '/404.html';
    if (file_exists($notFound) && is_file($notFound)) {
        header('Content-Type: text/html; charset=utf-8');
        readfile($notFound);
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    echo '<h1>Страница не найдена</h1>';
    exit;
}

// Проверяем существование группы в БД
try {
    $db = getDBConnection();
    $stmt = $db->prepare('SELECT 1 FROM `groups` WHERE slug = ? LIMIT 1');
    $stmt->execute([$slug]);
    $exists = (bool)$stmt->fetchColumn();
} catch (Throwable $e) {
    // Если БД недоступна — лучше не ломать роутинг полностью: отдаем group.html как раньше
    $exists = true;
}

if (!$exists) {
    http_response_code(404);
    $notFound = __DIR__ . '/404.html';
    if (file_exists($notFound) && is_file($notFound)) {
        header('Content-Type: text/html; charset=utf-8');
        readfile($notFound);
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    echo '<h1>Группа не найдена</h1><p>' . groupSeoE($slug) . '</p>';
    exit;
}

$groupFile = __DIR__ . '/group.html';
if (!file_exists($groupFile) || !is_file($groupFile)) {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    echo '<h1>Страница не найдена</h1>';
    exit;
}

header('Content-Type: text/html; charset=utf-8');
$content = file_get_contents($groupFile);

// Добавляем <base> для корректных относительных путей при /slug/ и прочих вариантах
if ($content !== false && strpos($content, '<base') === false) {
    $content = preg_replace('/(<head[^>]*>)/i', '$1' . "\n    " . '<base href="/">', $content, 1);
}

echo ($content !== false) ? $content : '';
exit;

