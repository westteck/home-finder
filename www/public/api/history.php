<?php
require_once __DIR__ . '/../db.php';
header('Content-Type: application/json');
$id = param('id', '');
if (!$id) { echo json_encode(['error' => 'id required']); exit; }
$rows = dbQueryAll("SELECT * FROM listing_history WHERE listing_id = ? ORDER BY checked_at DESC", [$id]);
echo json_encode($rows, JSON_PRETTY_PRINT);
