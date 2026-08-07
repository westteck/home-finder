import sqlite3, os, json
from contextlib import contextmanager

DB_PATH = os.environ.get('HF_DB_PATH', '/app/data/homefinder.db')

SCHEMA = """
CREATE TABLE IF NOT EXISTS listings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    source      TEXT NOT NULL,
    source_id   TEXT NOT NULL,
    raw_json    TEXT NOT NULL,
    mls_id      TEXT,
    status      TEXT,
    price       INTEGER,
    beds        REAL,
    baths       REAL,
    sqft        INTEGER,
    lot_size_sqft INTEGER,
    address     TEXT,
    city        TEXT,
    state       TEXT,
    zip         TEXT,
    county      TEXT,
    url         TEXT,
    photo_url   TEXT,
    listed_date TEXT,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at  TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, source_id)
);

CREATE TABLE IF NOT EXISTS listing_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id  INTEGER REFERENCES listings(id),
    field       TEXT NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    changed_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scraper_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    source      TEXT NOT NULL,
    run_at      TEXT DEFAULT CURRENT_TIMESTAMP,
    new_count   INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    duration_ms INTEGER,
    message     TEXT
);

CREATE TABLE IF NOT EXISTS search_criteria (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    city        TEXT,
    state       TEXT,
    min_price   INTEGER,
    max_price   INTEGER,
    min_beds    REAL,
    min_baths   REAL,
    min_lot_acres REAL,
    sources     TEXT,  -- JSON array of source names
    active      INTEGER DEFAULT 1,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);
"""

@contextmanager
def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, isolation_level=None)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    with get_db() as db:
        db.executescript(SCHEMA)
        # Seed default search criteria
        db.execute("""
            INSERT OR IGNORE INTO search_criteria (id, name, city, state, min_price, max_price, min_beds, min_baths, min_lot_acres, sources)
            VALUES (1, 'The Dalles', 'The Dalles', 'OR', 50000, 400000, 0, 1.5, 0.0, '[\"redfin\",\"zillow\",\"landwatch\"]')
        """)


def upsert_listing(db: sqlite3.Connection, source_name: str, flat: dict) -> tuple[int, int]:
    """Insert or update a listing. Returns (new_count, updated_count)."""
    cur = db.execute(
        "SELECT id, raw_json, price, status FROM listings WHERE source=? AND source_id=?",
        (source_name, flat.get("source_id", "")),
    )
    row = cur.fetchone()
    if row is None:
        db.execute(
            """
            INSERT INTO listings
            (source, source_id, raw_json, mls_id, status, price, beds, baths,
             sqft, lot_size_sqft, address, city, state, zip, county, url, photo_url, listed_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                source_name,
                flat.get("source_id", ""),
                flat.get("raw_json", "{}"),
                flat.get("mls_id") or None,
                flat.get("status", ""),
                flat.get("price") or None,
                flat.get("beds") or None,
                flat.get("baths") or None,
                flat.get("sqft") or None,
                flat.get("lot_size_sqft") or None,
                flat.get("address") or None,
                flat.get("city") or None,
                flat.get("state") or None,
                flat.get("zip") or None,
                flat.get("county") or None,
                flat.get("url") or None,
                flat.get("photo_url") or None,
                flat.get("listed_date") or None,
            ),
        )
        return 1, 0
    else:
        old_price = row["price"]
        old_status = row["status"]
        changes = []
        new_price = flat.get("price")
        new_status = flat.get("status", "")
        if new_price is not None and old_price != new_price:
            changes.append(("price", str(old_price) if old_price is not None else None, str(new_price)))
        if old_status != new_status:
            changes.append(("status", old_status, new_status))
        if changes:
            for field, old_val, new_val in changes:
                db.execute(
                    "INSERT INTO listing_history (listing_id, field, old_value, new_value) VALUES (?, ?, ?, ?)",
                    (row["id"], field, old_val, new_val),
                )
            db.execute(
                "UPDATE listings SET status=?, price=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                (new_status, new_price if new_price is not None else old_price, row["id"]),
            )
            return 0, 1
        return 0, 0
