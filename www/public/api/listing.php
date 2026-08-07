<?php
require_once __DIR__ . '/../db.php';
header('Content-Type: application/json');
$id = param('id', '');
if (!$id) { echo json_encode(['error' => 'id required']); exit; }
$row = dbQueryOne("SELECT * FROM listings WHERE id = ?", [$id]);
if (!$row) { echo json_encode(['error' => 'not found']); exit; }
echo json_encode($row, JSON_PRETTY_PRINT);
