<?php
// /api/settings.php — CRUD for key/value settings
require_once __DIR__ . '/../db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $key = param('key', '');
    if ($key) {
        $row = dbQueryOne("SELECT value FROM settings WHERE key = ?", [$key]);
        echo json_encode($row ? ['key'=>$key, 'value'=>$row['value']] : ['key'=>$key, 'value'=>null], JSON_PRETTY_PRINT);
    } else {
        $rows = dbQueryAll("SELECT key, value FROM settings ORDER BY key");
        echo json_encode($rows, JSON_PRETTY_PRINT);
    }
    exit;
}

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $key = $body['key'] ?? '';
    $val = $body['value'] ?? '';
    if (!$key) { echo json_encode(['error'=>'key required']); exit; }
    dbExec("INSERT INTO settings(key,value,updated_at) VALUES(?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at", [$key, $val]);
    echo json_encode(['ok'=>true, 'key'=>$key, 'value'=>$val], JSON_PRETTY_PRINT);
    exit;
}

echo json_encode(['error'=>'method not supported'], JSON_PRETTY_PRINT);
