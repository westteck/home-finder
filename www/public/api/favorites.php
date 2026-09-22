<?php
// /api/favorites.php — GET list, POST add, DELETE remove
// Stores listing snapshot so favorites survive scrapes.
require_once __DIR__ . '/../db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

// Helper: fetch listing columns as flat array
function listingCols(int $id): ?array {
    return dbQueryOne("SELECT * FROM listings WHERE id = ?", [$id]);
}

if ($method === 'GET') {
    $rows = dbQueryAll("
        SELECT
            f.id,
            f.listing_id,
            f.address,
            f.city,
            f.state,
            f.price,
            f.beds,
            f.baths,
            f.sqft,
            f.lot_size_sqft,
            f.url,
            f.photo_url,
            f.status,
            f.source_id,
            f.source,
            f.note,
            f.created_at
        FROM favorites f
        ORDER BY f.created_at DESC
    ");
    // Rehydrate from live listing if present, else use stored snapshot
    $out = [];
    foreach ($rows as $r) {
        $live = $r['listing_id'] ? listingCols((int)$r['listing_id']) : null;
        if ($live) {
            $merged = [
                'id'            => $r['id'],
                'listing_id'    => $r['listing_id'],
                'address'       => $live['address']  ?? $r['address'],
                'city'          => $live['city']     ?? $r['city'],
                'state'         => $live['state']    ?? $r['state'],
                'price'         => $live['price']   ?? $r['price'],
                'beds'          => $live['beds']     ?? $r['beds'],
                'baths'         => $live['baths']    ?? $r['baths'],
                'sqft'          => $live['sqft']     ?? $r['sqft'],
                'lot_size_sqft' => $live['lot_size_sqft'] ?? $r['lot_size_sqft'],
                'url'           => $live['url']     ?? $r['url'],
                'photo_url'     => $live['photo_url'] ?? $r['photo_url'],
                'status'        => $live['status']  ?? $r['status'],
                'source_id'     => $live['source_id'] ?? $r['source_id'],
                'source'        => $live['source']  ?? $r['source'],
                'is_snapshot'   => $live ? false : true,
            ];
        } else {
            $merged = [
                'id'            => $r['id'],
                'listing_id'    => $r['listing_id'],
                'address'       => $r['address'],
                'city'          => $r['city'],
                'state'         => $r['state'],
                'price'         => $r['price'],
                'beds'          => $r['beds'],
                'baths'         => $r['baths'],
                'sqft'          => $r['sqft'],
                'lot_size_sqft' => $r['lot_size_sqft'],
                'url'           => $r['url'],
                'photo_url'     => $r['photo_url'],
                'status'        => $r['status'],
                'source_id'     => $r['source_id'],
                'source'        => $r['source'],
                'is_snapshot'   => true,
            ];
        }
        $out[] = $merged;
    }
    echo json_encode(['favorites' => $out], JSON_PRETTY_PRINT);
    exit;
}

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $listing_id = (int) ($body['listing_id'] ?? 0);
    if (!$listing_id) { echo json_encode(['error' => 'listing_id required']); exit; }

    // Grab live listing snapshot
    $live = listingCols($listing_id);
    if (!$live) {
        echo json_encode(['error' => 'Listing not found']); exit;
    }

    $addr = $live['address'] ?? '';
    $city = $live['city'] ?? '';
    $st   = $live['state'] ?? '';
    $price = $live['price'] ?? 0;
    $beds  = $live['beds'] ?? null;
    $baths = $live['baths'] ?? null;
    $sqft  = $live['sqft'] ?? null;
    $lot   = $live['lot_size_sqft'] ?? null;
    $url   = $live['url'] ?? '';
    $photo = $live['photo_url'] ?? '';
    $status = $live['status'] ?? '';
    $source_id = $live['source_id'] ?? '';
    $source    = $live['source'] ?? '';
    $snapshot  = json_encode($live);

    // Delete existing favorite for this listing_id to avoid conflict, then insert with snapshot
    dbExec("DELETE FROM favorites WHERE listing_id = ?", [$listing_id]);
    dbExec("
        INSERT INTO favorites
        (listing_id, address, city, state, price, beds, baths, sqft, lot_size_sqft,
         url, photo_url, status, source_id, source, snapshot)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ", [
        $listing_id, $addr, $city, $st, $price, $beds, $baths, $sqft, $lot,
        $url, $photo, $status, $source_id, $source, $snapshot
    ]);

    echo json_encode(['ok' => true, 'listing_id' => $listing_id], JSON_PRETTY_PRINT);
    exit;
}

if ($method === 'DELETE') {
    $listing_id = param('listing_id', '');
    if (!$listing_id) { echo json_encode(['error' => 'listing_id required']); exit; }
    dbExec("DELETE FROM favorites WHERE listing_id = ?", [$listing_id]);
    echo json_encode(['ok' => true], JSON_PRETTY_PRINT);
    exit;
}

echo json_encode(['error' => 'method not supported'], JSON_PRETTY_PRINT);
