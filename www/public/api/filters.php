<?php
require_once __DIR__ . '/../db.php';
header('Content-Type: application/json');
$state = $_GET['state'] ?? '';
$county = $_GET['county'] ?? '';
$cities = [];
$states = [];
$counties = [];

if ($state !== '') {
    $counties = dbQueryAll("SELECT DISTINCT county FROM listings WHERE state = ? AND county != '' ORDER BY county", [$state]);
    $counties = array_column($counties, 'county');
    if ($county !== '') {
        $cities = dbQueryAll("SELECT DISTINCT city FROM listings WHERE state = ? AND county = ? AND city != '' ORDER BY city", [$state, $county]);
    } else {
        $cities = dbQueryAll("SELECT DISTINCT city FROM listings WHERE state = ? AND city != '' ORDER BY city", [$state]);
    }
} else {
    $cities = dbQueryAll("SELECT DISTINCT city FROM listings WHERE city != '' ORDER BY city");
}
$states = dbQueryAll("SELECT DISTINCT state FROM listings WHERE state != '' ORDER BY state");
echo json_encode([
    'cities' => array_column($cities, 'city'),
    'states' => array_column($states, 'state'),
    'counties' => $counties,
], JSON_PRETTY_PRINT);
