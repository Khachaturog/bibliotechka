<?php
/**
 * Скрипт для обработки красивых SEO URL карточек
 * Отдает detail.html напрямую, без редиректа
 * JavaScript сам извлечет url_seo_yandex из пути и загрузит данные
 */

// Отдаем detail.html с правильным базовым путем
$detailFile = __DIR__ . '/detail.html';
if (file_exists($detailFile)) {
    header('Content-Type: text/html; charset=utf-8');
    
    // Читаем содержимое файла
    $content = file_get_contents($detailFile);
    
    // Добавляем <base> тег после <head> или после первых тегов для правильного разрешения относительных путей
    // Это нужно, чтобы при URL /card/... пути к ресурсам разрешались от корня сайта
    if (strpos($content, '<base') === false) {
        // Ищем <head> и добавляем <base> сразу после него
        $content = preg_replace(
            '/(<head[^>]*>)/i',
            '$1' . "\n    " . '<base href="/">',
            $content,
            1
        );
    }
    
    echo $content;
    exit;
} else {
    http_response_code(404);
    echo '<h1>Страница не найдена</h1>';
}

