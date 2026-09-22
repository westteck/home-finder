<?php
// On-demand scraper API: /api/scrape_now.php?city=Coos+Bay&state=OR
require_once __DIR__ . '/../db.php';

header('Content-Type: application/json');

$city  = trim(param('city', ''));
$state = trim(param('state', ''));

if (!$city || !$state) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'city and state required']);
    exit;
}

// Validate state is 2-letter
if (!preg_match('/^[A-Za-z]{2}$/', $state)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'state must be 2 letters (e.g. OR, WA)']);
    exit;
}

$city_esc  = escapeshellarg($city);
$state_esc = escapeshellarg(strtoupper($state));
$cmd = "cd /app/scraper && PYTHONPATH=/app/scraper /opt/venv/bin/python3 -u /app/scraper/ondemand.py $city_esc $state_esc";

exec($cmd, $output, $exit_code);
$raw = implode("\n", $output);

$data = json_decode($raw, true);
if (!$data || !is_array($data)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Scraper failed', 'raw' => $raw, 'exit_code' => $exit_code]);
    exit;
}

// After scraping, return fresh listings for this city/state
$listings = dbQueryAll(
    "SELECT * FROM listings WHERE city = ? AND state = ? AND is_canonical = 1 ORDER BY price ASC LIMIT 50",
    [$city, strtoupper($state)]
);
$data['listings'] = $listings;
$data['listing_count'] = count($listings);

echo json_encode($data, JSON_PRETTY_PRINT);
