#!/usr/bin/env python3
"""Home Finder — unified scraper entry point.

Add new sources by importing their module and adding to SOURCES dict.
"""

import sys, time, traceback

from db import init_db, get_db, upsert_listing
import redfin
from regions import REGIONS

try:
    import homeharvest_scraper as hh
except ImportError:
    hh = None

SOURCES = {
    "redfin": redfin.run,
}

if hh is not None:
    SOURCES["realtor"] = hh.run


def main():
    start = time.time()
    init_db()
    total_new = total_updated = total_errors = 0
    with get_db() as db:
        for source_name, run_fn in SOURCES.items():
            print(f"Scraping {source_name}...")
            try:
                n, u, e = run_fn(db)
                total_new += n
                total_updated += u
                total_errors += e
            except Exception as exc:
                print(f"  ERROR {source_name}: {exc}")
                traceback.print_exc()
                total_errors += 1
        duration = int((time.time() - start) * 1000)
        db.execute(
            "INSERT INTO scraper_log (source, new_count, updated_count, error_count, duration_ms, message) VALUES (?, ?, ?, ?, ?, ?)",
            ("all", total_new, total_updated, total_errors, duration, f"Ran {len(SOURCES)} source(s), {len(REGIONS)} region(s)"),
        )
        print(f"Done: {total_new} new, {total_updated} updated, {total_errors} errors, {duration}ms")


if __name__ == "__main__":
    main()
