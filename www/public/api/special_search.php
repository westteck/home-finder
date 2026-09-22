<?php
/* Special searches - homestead scoring + region presets for the 2026 property hunt.
   NOTE: uses array index loops, never foreach-as-reference (write_file &-encoding pitfall). */
header('Content-Type: application/json');
require_once __DIR__ . '/../db.php';

$type  = param('type', 'homestead');
$page  = max(1, intval(param('page', 1)));
$limit = min(100, intval(param('per_page', 24)));
$offset = ($page - 1) * $limit;
$minPrice = (int) param('min_price', 0);
$maxPrice = (int) param('max_price', 400000);

$where = ["is_canonical = 1", "price BETWEEN $minPrice AND $maxPrice"];
$bindings = [];

/* Town pools per region - matched against city, zip or county (rural addresses use nearest town as city). */
$REGIONS = array(
    'n_clark' => array('Battle Ground','Brush Prairie','Hockinson','Ridgefield','La Center','Yacolt','Amboy','Vancouver','Camas','Washougal'),
    'cowlitz' => array('Woodland','Kalama','Castle Rock','Longview','Kelso','Toutle','Vader','Ryderwood','Ariel','Cougar'),
    'lewis'   => array('Centralia','Chehalis','Napavine','Winlock','Toledo','Mossyrock','Onalaska','Vader','Doty','Curtis'),
    'salem'   => array('Salem','Dallas','Monmouth','Independence','Turner','Aumsville','Silverton','Stayton','Sublimity','Jefferson'),
    'albany'  => array('Albany','Lebanon','Philomath','Adair Village','Tangent','Brownsville','Halsey','Harrisburg','Monroe','Scio','Sodaville','Crawfordsville','Corvallis'),
    'sleeper' => array('Halsey','Harrisburg','Brownsville','Cottage Grove','Vernonia','Ryderwood','Toutle','Mossyrock','Tangent','Millersburg'),
    'all'     => array(),
);
/* ZIP matching removed: guessed rural zips cross-contaminated regions (La Center in cowlitz etc.).
   City + county matching is sufficient - Redfin/HomeHarvest always set county. */
$REG_ZIPS = array(
    'n_clark' => array(), 'cowlitz' => array(), 'lewis' => array(),
    'salem' => array(), 'albany' => array(), 'sleeper' => array(),
    'all' => array(), 'homestead' => array(),
);
$REG_COUNTY = array(
    'n_clark' => 'CLARK', 'cowlitz' => 'COWLITZ', 'lewis' => 'LEWIS',
    'salem' => 'MARION|POLK', 'albany' => 'LINN|BENTON',
    'sleeper' => 'LINN|LANE|COLUMBIA|COWLITZ|LEWIS',
    'all' => '', 'homestead' => '',
);
$REGIONS['homestead'] = array();   /* default: target-region homestead hunt, scored */
$REG_ZIPS['homestead'] = array();
$REG_COUNTY['homestead'] = 'CLARK|COWLITZ|LEWIS|MARION|POLK|LINN|BENTON';

if (!isset($REGIONS[$type])) {
    http_response_code(400);
    echo json_encode(array('ok' => false, 'error' => 'unknown type'));
    exit;
}

$towns = $REGIONS[$type];
$zips  = $REG_ZIPS[$type];
$countyRe = $REG_COUNTY[$type];

if (!empty($towns) || $countyRe !== '' || !empty($zips)) {
    $parts = array();
    foreach ($towns as $t) { $parts[] = 'LOWER(COALESCE(city,\'\')) = ' . strtolower(db()->quote($t)); }
    foreach ($zips as $z) { $parts[] = 'COALESCE(zip,\'\') = ' . db()->quote($z); }
    foreach (explode('|', $countyRe) as $c) {
        if (trim($c) !== '') { $parts[] = "UPPER(COALESCE(county,'')) LIKE '%" . strtoupper($c) . "%'"; }
    }
    if (!empty($parts)) { $where[] = '(' . implode(' OR ', $parts) . ')'; }
}

/* Homestead core criteria: 1-5+ usable acres, retirement-suitable house. */
$where[] = '(lot_size_sqft >= 43560 OR lot_size_sqft IS NULL)';
$where[] = '(beds >= 2 OR beds IS NULL)';

$where_sql = implode(' AND ', $where);

/* SQLite MIN/MAX scalar functions take N args, so the score expression is valid.
   Score scaled to 0-100: land(35) house(25) beds(15) baths(10) $/acre-efficiency(15) mapped(5). */
$score = "(
    35 * MIN(CAST(COALESCE(lot_size_sqft,0) AS REAL) / 43560.0, 6.0) / 6.0
  + 20 * MIN(CAST(COALESCE(sqft,0) AS REAL) / 1000.0, 2.0) / 2.0
  + 15 * (CASE WHEN COALESCE(beds,0) >= 3 THEN 1.0 WHEN COALESCE(beds,0) = 2 THEN 0.55 ELSE 0 END)
  + 10 * (CASE WHEN COALESCE(baths,0) >= 2 THEN 1.0 WHEN COALESCE(baths,0) >= 1 THEN 0.5 ELSE 0 END)
  + 15 * (CASE WHEN price > 0 AND lot_size_sqft >= 43560 THEN MAX(0, 1.0 - ((price / lot_size_sqft) / 40.0)) ELSE 0 END)
  + 5 * (CASE WHEN COALESCE(latitude,0) != 0 THEN 1.0 ELSE 0 END)
)";

$count_sql = "SELECT COUNT(*) FROM listings WHERE $where_sql";
$total = intval(dbQueryOne($count_sql, $bindings)['COUNT(*)']);
$pages = max(1, ceil($total / $limit));

$fields = "id, source, source_id, mls_id, status, price, beds, baths, sqft, lot_size_sqft, address, city, state, zip, county, url, photo_url, listed_date, latitude, longitude, ($score) AS homestead_score";
$select = "SELECT $fields FROM listings WHERE $where_sql ORDER BY homestead_score DESC LIMIT $limit OFFSET $offset";
$rows = dbQueryAll($select, $bindings);

/* Enrich from raw_json: garage spaces, stories, year built. */
$out = array();
foreach ($rows as $i => $r) {
    $raw = json_decode($r['raw_json'] ?? '{}', true);
    if (!is_array($raw)) $raw = array();
    $garage = null;
    if (isset($raw['skGarageSpaces']['value'])) $garage = $raw['skGarageSpaces']['value'];
    elseif (isset($raw['garage_spaces'])) $garage = $raw['garage_spaces'];
    $stories = null;
    if (isset($raw['stories']['value'])) $stories = $raw['stories']['value'];
    elseif (isset($raw['story_number'])) $stories = $raw['story_number'];
    $year = null;
    if (isset($raw['yearBuilt']['value'])) $year = $raw['yearBuilt']['value'];
    elseif (isset($raw['year_built'])) $year = $raw['year_built'];

    $acres = $r['lot_size_sqft'] ? round($r['lot_size_sqft'] / 43560.0, 2) : null;
    $out[$i] = array(
        'id' => $r['id'], 'source' => $r['source'], 'source_id' => $r['source_id'],
        'status' => $r['status'], 'price' => $r['price'], 'beds' => $r['beds'], 'baths' => $r['baths'],
        'sqft' => $r['sqft'], 'lot_size_sqft' => $r['lot_size_sqft'], 'acres' => $acres,
        'address' => $r['address'], 'city' => $r['city'], 'state' => $r['state'], 'zip' => $r['zip'],
        'county' => $r['county'], 'url' => $r['url'], 'photo_url' => $r['photo_url'],
        'listed_date' => $r['listed_date'], 'latitude' => $r['latitude'], 'longitude' => $r['longitude'],
        'garage_spaces' => $garage, 'stories' => $stories, 'year_built' => $year,
        'homestead_score' => round(floatval($r['homestead_score'] ?? 0), 1),
        'price_per_acre' => ($r['lot_size_sqft'] >= 43560 && $r['price'] > 0) ? round($r['price'] / $r['lot_size_sqft'], 2) : null,
    );
}

echo json_encode(array(
    'type' => $type, 'total' => $total, 'page' => $page, 'per_page' => $limit, 'pages' => $pages,
    'listings' => $out,
), JSON_PRETTY_PRINT);