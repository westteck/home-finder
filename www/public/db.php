<?php
$DB_PATH = '/app/data/homefinder.db';

function db(): PDO {
    global $DB_PATH;
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('sqlite:' . $DB_PATH);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }
    return $pdo;
}

function param(string $key, $default = null) { return $_GET[$key] ?? $_POST[$key] ?? $default; }
function e(string $s = ''): string { return htmlspecialchars($s ?? '', ENT_QUOTES, 'UTF-8'); }

function dbQueryOne(string $sql, array $bindings = []) {
    $stmt = db()->prepare($sql);
    $stmt->execute($bindings);
    return $stmt->fetch();
}

function dbQueryAll(string $sql, array $bindings = []): array {
    $stmt = db()->prepare($sql);
    $stmt->execute($bindings);
    return $stmt->fetchAll();
}

function htp(array $params = []): string {
    $q = [];
    foreach ($params as $k => $v) {
        if ($v !== null && $v !== '') $q[] = urlencode($k).'='.urlencode($v);
    }
    return $q ? '?' . implode('&', $q) : '';
}
