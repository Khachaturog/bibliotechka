<?php
/**
 * Вспомогательные функции для входа: rate limiting
 */

function getAttemptsFilePath(): string {
    $dir = __DIR__ . '/data';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    return $dir . '/attempts.json';
}

function loadAttempts(): array {
    $path = getAttemptsFilePath();
    if (!file_exists($path)) {
        return [];
    }
    $json = file_get_contents($path);
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

function saveAttempts(array $data): void {
    file_put_contents(getAttemptsFilePath(), json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function getClientIp(): string {
    return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * Проверяет, заблокирован ли IP. Возвращает [blocked: bool, message: ?string]
 */
function checkRateLimit(int $maxAttempts, int $blockMinutes): array {
    $ip = getClientIp();
    $attempts = loadAttempts();
    $now = time();

    if (!isset($attempts[$ip])) {
        return ['blocked' => false, 'message' => null];
    }

    $entry = $attempts[$ip];
    $blockedUntil = $entry['blocked_until'] ?? 0;

    if ($blockedUntil > $now) {
        $minutesLeft = (int) ceil(($blockedUntil - $now) / 60);
        return [
            'blocked' => true,
            'message' => "Слишком много попыток. Попробуйте через {$minutesLeft} мин.",
        ];
    }

    // Блок истёк — сбрасываем
    if ($blockedUntil > 0) {
        unset($attempts[$ip]);
        saveAttempts($attempts);
    }

    return ['blocked' => false, 'message' => null];
}

/**
 * Регистрирует неудачную попытку. Возвращает true если после этого IP заблокирован.
 */
function recordFailedAttempt(int $maxAttempts, int $blockMinutes): bool {
    $ip = getClientIp();
    $attempts = loadAttempts();
    $now = time();

    if (!isset($attempts[$ip])) {
        $attempts[$ip] = ['count' => 0, 'last_attempt' => null, 'blocked_until' => null];
    }

    $attempts[$ip]['count'] = ($attempts[$ip]['count'] ?? 0) + 1;
    $attempts[$ip]['last_attempt'] = $now;

    if ($attempts[$ip]['count'] >= $maxAttempts) {
        $attempts[$ip]['blocked_until'] = $now + ($blockMinutes * 60);
        saveAttempts($attempts);
        return true;
    }

    saveAttempts($attempts);
    return false;
}

function clearAttemptsForIp(): void {
    $ip = getClientIp();
    $attempts = loadAttempts();
    unset($attempts[$ip]);
    saveAttempts($attempts);
}
