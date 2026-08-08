#!/usr/bin/env python3
"""Deduplication: group by address+city+state, mark cheapest as canonical."""
import sqlite3
from db import get_db

def run_dedup():
    with get_db() as db:
        # Reset all
        db.execute("UPDATE listings SET is_canonical = 1, duplicate_group = NULL")
        
        # Find groups with >1 listing
        groups = db.execute("""
            SELECT address, city, state, COUNT(*) as cnt, MIN(id) as canonical_id
            FROM listings
            WHERE address IS NOT NULL AND address != ''
            GROUP BY address, city, state
            HAVING cnt > 1
        """).fetchall()
        
        for addr, city, state, cnt, canonical_id in groups:
            group_key = f"{addr}|{city}|{state}"
            # Mark all in group as non-canonical first
            db.execute("""
                UPDATE listings SET is_canonical = 0, duplicate_group = ?
                WHERE address = ? AND city = ? AND state = ?
            """, (group_key, addr, city, state))
            
            # Mark cheapest as canonical (or newest if tie)
            cheapest = db.execute("""
                SELECT id FROM listings
                WHERE address = ? AND city = ? AND state = ?
                ORDER BY CASE WHEN price IS NULL THEN 999999999 ELSE price END ASC,
                         created_at DESC
                LIMIT 1
            """, (addr, city, state)).fetchone()
            
            if cheapest:
                db.execute("""
                    UPDATE listings SET is_canonical = 1
                    WHERE id = ?
                """, (cheapest['id'],))
        
        # Stats
        total = db.execute("SELECT COUNT(*) FROM listings").fetchone()[0]
        canonical = db.execute("SELECT COUNT(*) FROM listings WHERE is_canonical = 1").fetchone()[0]
        dupes = total - canonical
        print(f"Deduplication: {total} total, {canonical} canonical, {dupes} duplicates hidden")

if __name__ == "__main__":
    run_dedup()
