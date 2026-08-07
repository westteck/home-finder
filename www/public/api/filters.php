<?php
require_once __DIR__ . '/../db.php';
header('Content-Type: application/json');
$cities = dbQueryAll("SELECT DISTINCT city FROM listings WHERE city != '' ORDER BY city");
$states = dbQueryAll("SELECT DISTINCT state FROM listings WHERE state != '' ORDER BY state");
echo json_encode(['cities' => array_column($cities, 'city'), 'states' => array_column($states, 'state')], JSON_PRETTY_PRINT);
