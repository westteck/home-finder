#!/usr/bin/env python3
"""DB migration: add favorites, saved_searches, settings tables."""
import sqlite3, sys

DB = '/app/data/homefinder.db'

def migrate():
    conn = sqlite3.connect(DB)
    c = conn.cursor()

    # Favorites
    c.execute("""
        CREATE TABLE IF NOT EXISTS favorites (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            listing_id  INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            note        TEXT,
            created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(listing_id)
        )
    """)

    # Saved searches (enhanced from search_criteria)
    c.execute("""
        CREATE TABLE IF NOT EXISTS saved_searches (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            filters     TEXT NOT NULL,  -- JSON: {min_price, max_price, beds, baths, lot, city, state, sort, q}
            active      INTEGER DEFAULT 1,
            notify      INTEGER DEFAULT 0,  -- 1 = email digest when new matches
            created_at  TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Settings key/value store
    c.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key         TEXT PRIMARY KEY,
            value       TEXT NOT NULL,
            updated_at  TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()
    print("Migration OK")

if __name__ == '__main__':
    migrate()
