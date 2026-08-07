<?php
require_once __DIR__ . '/../db.php';
header('Content-Type: application/json');
$stats = dbQueryOne("SELECT COUNT(*) as total, MIN(price) as min_price, MAX(price) as max_price FROM listings WHERE status LIKE 'Active'");
echo json_encode($stats, JSON_PRETTY_PRINT);
