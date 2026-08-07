<?php
// /api/favorites.php — GET list, POST add, DELETE remove
require_once __DIR__ . '/../db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = dbQueryAll("SELECT f.*, l.address, l.city, l.state, l.price, l.beds, l.baths, l.url, l.photo_url FROM favorites f JOIN listings l ON f.listing_id = l.id ORDER BY f.created_at DESC");
    echo json_encode(['favorites'=>$rows], JSON_PRETTY_PRINT);
    exit;
}

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $listing_id = $body['listing_id'] ?? '';
    if (!$listing_id) { echo json_encode(['error'=>'listing_id required']); exit; }
    dbExec("INSERT INTO favorites(listing_id) VALUES(?) ON CONFLICT(listing_id) DO NOTHING", [$listing_id]);
    echo json_encode(['ok'=>true, 'listing_id'=>$listing_id], JSON_PRETTY_PRINT);
    exit;
}

if ($method === 'DELETE') {
    $listing_id = param('listing_id', '');
    if (!$listing_id) { echo json_encode(['error'=>'listing_id required']); exit; }
    dbExec("DELETE FROM favorites WHERE listing_id = ?", [$listing_id]);
    echo json_encode(['ok'=>true], JSON_PRETTY_PRINT);
    exit;
}

echo json_encode(['error'=>'method not supported'], JSON_PRETTY_PRINT);
