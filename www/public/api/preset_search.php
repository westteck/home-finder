<?php
/* Preset / "smart" searches — value-oriented filters */
header('Content-Type: application/json');
require_once __DIR__ . '/../db.php';

$type = $_GET['type'] ?? 'best_value';
$page = max(1, intval($_GET['page'] ?? 1));
$limit = min(100, intval($_GET['per_page'] ?? 24));
$offset = ($page - 1) * $limit;

$where = ['is_canonical = 1', 'price > 0'];
$order = 'price ASC';
$score_col = '';

switch ($type) {
    case 'best_value':
        // Lowest price per sqft, exclude outliers ($/sqft < 500)
        $where[] = 'sqft > 0';
        $score_col = 'CAST(price AS REAL) / sqft AS price_per_sqft';
        $order = 'price_per_sqft ASC';
        break;

    case 'budget':
        // Under $150k
        $where[] = 'price <= 150000';
        break;

    case 'family_starter':
        // 3+ beds, under $350k, best price/sqft
        $where[] = 'beds >= 3';
        $where[] = 'price BETWEEN 50000 AND 350000';
        $score_col = 'CAST(price AS REAL) / sqft AS price_per_sqft';
        $order = 'price_per_sqft ASC';
        break;

    case 'acreage':
        // 1+ acres under $500k
        $where[] = 'lot_size_sqft >= 43560';
        $where[] = 'price <= 500000';
        $score_col = 'CAST(price AS REAL) / NULLIF(lot_size_sqft,0) AS price_per_acre';
        $order = 'price_per_acre ASC';
        break;

    case 'big_land':
        // 10+ acres
        $where[] = 'lot_size_sqft >= 435600';
        $where[] = 'price > 0';
        $score_col = 'CAST(price AS REAL) / NULLIF(lot_size_sqft,0) AS price_per_acre';
        $order = 'price_per_acre ASC';
        break;

    case 'fixer':
        // Under $100k
        $where[] = 'price <= 100000';
        $where[] = 'sqft > 0';
        break;

    case 'price_drop':
        // Has listing_history with 2+ records
        $subsql = "SELECT listing_id FROM listing_history WHERE price > 0 GROUP BY listing_id HAVING COUNT(*) >= 2";
        $where[] = "id IN ($subsql)";
        break;

    default:
        $score_col = 'CAST(price AS REAL) / sqft AS price_per_sqft';
        $order = 'price_per_sqft ASC';
}

$where_sql = implode(' AND ', $where);
$count_sql = "SELECT COUNT(*) FROM listings WHERE $where_sql";
$total = intval(dbQueryOne($count_sql)['COUNT(*)']);
$pages = max(1, ceil($total / $limit));

$fields = "id, source, source_id, mls_id, status, price, beds, baths, sqft, lot_size_sqft, address, city, state, zip, county, url, photo_url, listed_date, latitude, longitude";
if ($score_col) $fields .= ", $score_col";

$select = "SELECT $fields FROM listings WHERE $where_sql ORDER BY $order LIMIT $limit OFFSET $offset";
$rows = dbQueryAll($select);

echo json_encode([
    'type' => $type,
    'total' => $total,
    'page' => $page,
    'per_page' => $limit,
    'pages' => $pages,
    'listings' => $rows,
], JSON_PRETTY_PRINT);
