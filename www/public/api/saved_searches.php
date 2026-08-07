<?php
// /api/saved_searches.php — GET list, POST create, PUT update, DELETE
require_once __DIR__ . '/../db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = param('id', '');
    if ($id) {
        $row = dbQueryOne("SELECT * FROM saved_searches WHERE id = ?", [$id]);
        echo json_encode($row ?: ['error'=>'not found'], JSON_PRETTY_PRINT);
    } else {
        $rows = dbQueryAll("SELECT id, name, filters, active, notify, created_at FROM saved_searches ORDER BY created_at DESC");
        echo json_encode(['saved_searches'=>$rows], JSON_PRETTY_PRINT);
    }
    exit;
}

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $name = $body['name'] ?? '';
    $filters = json_encode($body['filters'] ?? []);
    $notify = ($body['notify'] ?? false) ? 1 : 0;
    if (!$name) { echo json_encode(['error'=>'name required']); exit; }
    dbExec("INSERT INTO saved_searches(name, filters, notify) VALUES(?,?,?)", [$name, $filters, $notify]);
    $id = db()->lastInsertId();
    echo json_encode(['ok'=>true, 'id'=>$id], JSON_PRETTY_PRINT);
    exit;
}

if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $id = $body['id'] ?? '';
    if (!$id) { echo json_encode(['error'=>'id required']); exit; }
    $updates = [];
    $vals = [];
    foreach (['name','filters','active','notify'] as $k) {
        if (array_key_exists($k, $body)) {
            $updates[] = "$k = ?";
            $vals[] = ($k === 'filters') ? json_encode($body[$k]) : (($k === 'active' || $k === 'notify') ? ($body[$k] ? 1 : 0) : $body[$k]);
        }
    }
    if ($updates) {
        $vals[] = $id;
        dbExec("UPDATE saved_searches SET " . implode(', ', $updates) . " WHERE id = ?", $vals);
    }
    echo json_encode(['ok'=>true], JSON_PRETTY_PRINT);
    exit;
}

if ($method === 'DELETE') {
    $id = param('id', '');
    if (!$id) { echo json_encode(['error'=>'id required']); exit; }
    dbExec("DELETE FROM saved_searches WHERE id = ?", [$id]);
    echo json_encode(['ok'=>true], JSON_PRETTY_PRINT);
    exit;
}

echo json_encode(['error'=>'method not supported'], JSON_PRETTY_PRINT);
