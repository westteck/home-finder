<?php
// seed_safe_searches.php — add safe-area saved searches to homefinder DB
$dbPath = '/app/data/homefinder.db';
$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$searches = [
    [
        'name' => 'Safe Area: Clark / Cowlitz WA',
        'filters' => ['state' => 'WA', 'safe_area' => '1', 'min_price' => '50000', 'max_price' => '350000', 'min_beds' => '2'],
        'notify' => 0,
    ],
    [
        'name' => 'Safe Area: Thurston / Lewis WA',
        'filters' => ['state' => 'WA', 'safe_area' => '1', 'min_price' => '50000', 'max_price' => '350000', 'min_beds' => '2'],
        'notify' => 0,
    ],
    [
        'name' => 'Safe Area: Columbia / Clatsop OR',
        'filters' => ['state' => 'OR', 'safe_area' => '1', 'min_price' => '50000', 'max_price' => '350000', 'min_beds' => '2'],
        'notify' => 0,
    ],
    [
        'name' => 'Safe Area: Kitsap / Pierce WA',
        'filters' => ['state' => 'WA', 'safe_area' => '1', 'min_price' => '50000', 'max_price' => '350000', 'min_beds' => '2'],
        'notify' => 0,
    ],
];

$stmt = $pdo->prepare("INSERT INTO saved_searches(name, filters, notify, created_at) VALUES(?,?,?,datetime('now'))");

foreach ($searches as $s) {
    $stmt->execute([$s['name'], json_encode($s['filters']), $s['notify']]);
    echo "Added: {$s['name']}\n";
}

echo "Done.\n";
