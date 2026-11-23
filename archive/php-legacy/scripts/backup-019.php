<?php
/**
 * Backup DB before migration 019 (cover_short / cover_large, drop cover & cover_notion).
 * Run: php scripts/backup-019.php
 */

$baseDir = dirname(__DIR__);
require_once $baseDir . '/api/config.php';

$outDir = $baseDir . '/backups';
$ts = date('Ymd_His');
$file = $outDir . '/backup_before_migration_019_' . $ts . '.sql';

if (!is_dir($outDir)) {
    mkdir($outDir, 0755, true);
}

$pdo = getDBConnection();
$pdo->exec('SET NAMES utf8mb4');

$sql = "-- Backup before migration 019\n";
$sql .= "-- " . date('c') . "\n\n";
$sql .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";

$tables = ['groups', 'subgroups', 'versions', 'authors', 'data', 'card_authors'];
foreach ($tables as $t) {
    $create = $pdo->query("SHOW CREATE TABLE `$t`")->fetch(PDO::FETCH_NUM);
    $sql .= "DROP TABLE IF EXISTS `$t`;\n";
    $sql .= $create[1] . ";\n\n";

    $rows = $pdo->query("SELECT * FROM `$t`")->fetchAll(PDO::FETCH_ASSOC);
    if (count($rows) === 0) {
        $sql .= "-- Table `$t`: no data\n\n";
        continue;
    }
    $cols = array_keys($rows[0]);
    $colList = '`' . implode('`,`', $cols) . '`';
    foreach ($rows as $r) {
        $vals = [];
        foreach ($cols as $c) {
            $v = $r[$c];
            $vals[] = $v === null ? 'NULL' : $pdo->quote($v);
        }
        $sql .= "INSERT INTO `$t` ($colList) VALUES (" . implode(',', $vals) . ");\n";
    }
    $sql .= "\n";
}

$sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";

file_put_contents($file, $sql);
echo "Backup written: $file\n";
