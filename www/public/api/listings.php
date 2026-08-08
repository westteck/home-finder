<?php
// API: /api/listings.php?min_price=50000&max_price=400000&...
require_once __DIR__ . '/../db.php';

header('Content-Type: application/json');

$sort      = param('sort', 'price_asc');
$minPrice  = (int) param('min_price', 0);
$maxPrice  = (int) param('max_price', 999000000);
$minBeds   = (float) param('min_beds', 0);
$minBaths  = (float) param('min_baths', 0);
$minLot    = (float) param('min_lot', 0);
$status    = param('status', 'Active');
$city      = param('city', '');
$state     = param('state', '');
$q         = param('q', '');
$latMin    = (float) param('lat_min', 0);
$latMax    = (float) param('lat_max', 0);
$lngMin    = (float) param('lng_min', 0);
$lngMax    = (float) param('lng_max', 0);
$page      = max(1, (int) param('page', 1));
$perPage   = (int) param('per_page', 50) ?: 50;

$order = match ($sort) {
    'price_desc' => 'price DESC',
    'price_asc'  => 'price ASC',
    'beds_desc'  => 'beds DESC',
    'beds_asc'   => 'beds ASC',
    'lot_desc'   => 'lot_size_sqft DESC',
    'lot_asc'    => 'lot_size_sqft ASC',
    'newest'     => 'first_seen DESC',
    default      => 'price ASC',
};

$where = ['price BETWEEN ? AND ?'];
$bindings = [$minPrice, $maxPrice];

if ($minBeds > 0)  { $where[] = 'beds >= ?';   $bindings[] = $minBeds; }
if ($minBaths > 0) { $where[] = 'baths >= ?';  $bindings[] = $minBaths; }
if ($minLot > 0)   { $where[] = 'lot_size_sqft >= ?'; $bindings[] = $minLot * 43560; }
if ($status)        { $where[] = 'status LIKE ?';  $bindings[] = "%$status%"; }
if ($city)          { $where[] = 'city = ?';       $bindings[] = $city; }
if ($state)         { $where[] = 'state = ?';      $bindings[] = $state; }
if ($q)             { $where[] = '(address LIKE ? OR city LIKE ? OR zip LIKE ?)'; $bindings[] = "%$q%"; $bindings[] = "%$q%"; $bindings[] = "%$q%"; }

if ($latMin != 0 && $latMax != 0 && $lngMin != 0 && $lngMax != 0) {
    $where[] = 'latitude >= ? AND latitude <= ? AND longitude >= ? AND longitude <= ?';
    $bindings[] = $latMin;
    $bindings[] = $latMax;
    $bindings[] = $lngMin;
    $bindings[] = $lngMax;
}

$whereSQL = implode(' AND ', $where);

$count = (int) (dbQueryOne("SELECT COUNT(*) FROM listings WHERE $whereSQL", $bindings)['COUNT(*)'] ?? 0);
$offset = ($page - 1) * $perPage;
$cards = dbQueryAll("SELECT * FROM listings WHERE $whereSQL ORDER BY $order LIMIT ? OFFSET ?", [...$bindings, $perPage, $offset]);

$output = [
    'total'    => $count,
    'per_page' => $perPage,
    'page'     => $page,
    'pages'    => (int) ceil($count / $perPage),
    'listings' => $cards,
];
echo json_encode($output, JSON_PRETTY_PRINT);
