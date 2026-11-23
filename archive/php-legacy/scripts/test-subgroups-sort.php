<?php
/**
 * Тестовый скрипт для проверки сортировки подгрупп по sort
 * 
 * Использование:
 * php scripts/test-subgroups-sort.php [group_slug]
 * 
 * Примеры:
 * php scripts/test-subgroups-sort.php designer
 * php scripts/test-subgroups-sort.php trainer
 */

$baseDir = dirname(__DIR__);
require_once $baseDir . '/api/config.php';

$groupSlug = $argv[1] ?? 'designer'; // По умолчанию проверяем группу 'designer'

echo "🧪 Тестирование сортировки подгрупп по колонке sort\n";
echo "📋 Группа: {$groupSlug}\n";
echo str_repeat("=", 60) . "\n\n";

try {
    $pdo = getDBConnection();
    
    // Тест 1: Проверяем API endpoint с group_slug
    echo "1️⃣ Тест API endpoint с group_slug:\n";
    echo "   Запрос: SELECT * FROM subgroups WHERE group_slug = '{$groupSlug}' ORDER BY sort\n\n";
    
    $sql = "SELECT slug, title_ru, group_slug, sort 
            FROM subgroups 
            WHERE group_slug = ? 
            ORDER BY sort";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$groupSlug]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($results)) {
        echo "   ⚠️  Подгруппы не найдены для группы '{$groupSlug}'\n";
        echo "   Попробуйте другую группу, например: designer, trainer, skill\n\n";
    } else {
        echo "   ✅ Найдено подгрупп: " . count($results) . "\n\n";
        echo "   Порядок подгрупп (по sort):\n";
        foreach ($results as $index => $subgroup) {
            $sort = $subgroup['sort'] ?? 'NULL';
            $title = $subgroup['title_ru'] ?? $subgroup['slug'];
            echo "   " . ($index + 1) . ". sort={$sort} | {$subgroup['slug']} | {$title}\n";
        }
    }
    
    echo "\n" . str_repeat("-", 60) . "\n\n";
    
    // Тест 2: Проверяем, что сортировка действительно по sort, а не по title_ru
    echo "2️⃣ Проверка правильности сортировки:\n";
    
    if (!empty($results)) {
        $sorts = array_column($results, 'sort');
        $isSorted = true;
        for ($i = 0; $i < count($sorts) - 1; $i++) {
            $current = $sorts[$i] ?? 0;
            $next = $sorts[$i + 1] ?? 0;
            if ($current > $next) {
                $isSorted = false;
                echo "   ❌ Ошибка: sort[{$i}]={$current} > sort[" . ($i + 1) . "]={$next}\n";
                break;
            }
        }
        
        if ($isSorted) {
            echo "   ✅ Сортировка корректна: все значения sort идут по возрастанию\n";
        }
    }
    
    echo "\n" . str_repeat("-", 60) . "\n\n";
    
    // Тест 3: Проверяем API endpoint БЕЗ group_slug (должен быть ORDER BY title_ru)
    echo "3️⃣ Тест API endpoint БЕЗ group_slug:\n";
    echo "   Запрос: SELECT * FROM subgroups ORDER BY title_ru\n\n";
    
    $sqlAll = "SELECT slug, title_ru, group_slug, sort 
               FROM subgroups 
               ORDER BY title_ru 
               LIMIT 10";
    $stmtAll = $pdo->query($sqlAll);
    $resultsAll = $stmtAll->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   ✅ Первые 10 подгрупп (сортировка по title_ru):\n";
    foreach ($resultsAll as $index => $subgroup) {
        $title = $subgroup['title_ru'] ?? $subgroup['slug'];
        echo "   " . ($index + 1) . ". {$subgroup['slug']} | {$title}\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "✅ Тестирование завершено!\n";
    echo "\n💡 Для проверки на странице:\n";
    echo "   1. Запустите локальный сервер: ./start-api.sh\n";
    echo "   2. Откройте в браузере: http://localhost:8000/{$groupSlug}\n";
    echo "   3. Проверьте порядок подгрупп на странице\n";
    
} catch (PDOException $e) {
    echo "❌ Ошибка подключения к БД: " . $e->getMessage() . "\n";
    exit(1);
}
