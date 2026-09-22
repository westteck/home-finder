#!/usr/bin/env python3
"""On-demand scraper for a single city/state.

Usage: python3 ondemand.py "Coos Bay" OR
Returns JSON with counts and any errors.
"""

import json, sys, os, time

# Ensure scraper modules are on path
sys.path.insert(0, '/app/scraper')

from db import init_db, get_db, upsert_listing
from regions import REGIONS

try:
    import redfin
except ImportError:
    redfin = None

try:
    import homeharvest_scraper as hh
except ImportError:
    hh = None


def find_region(city: str, state: str) -> int | None:
    """Find region_id by city/state from REGIONS dict."""
    city_lower = city.lower().strip()
    state_upper = state.upper().strip()
    for rid, (c, s) in REGIONS.items():
        if c.lower() == city_lower and s.upper() == state_upper:
            return rid
    return None


def run(city: str, state: str) -> dict:
    init_db()
    start = time.time()
    total_new = total_updated = total_errors = 0
    messages = []

    # Suppress noisy stdout from submodules; logs go to stderr
    old_stdout = sys.stdout
    sys.stdout = open(os.devnull, 'w')

    with get_db() as db:
        # Redfin
        if redfin:
            rid = find_region(city, state)
            if rid:
                try:
                    n, u, e = redfin.run_region(db, rid, city, state)
                    total_new += n
                    total_updated += u
                    total_errors += e
                    messages.append(f"Redfin {city}: {n} new, {u} updated, {e} errors")
                except Exception as exc:
                    total_errors += 1
                    messages.append(f"Redfin {city} ERROR: {exc}")
            else:
                messages.append(f"Redfin: no region_id for {city}, {state}")

        # HomeHarvest (always try — it accepts any city string)
        if hh:
            try:
                location = f"{city}, {state}"
                n, u, e = hh.run_region(db, location)
                total_new += n
                total_updated += u
                total_errors += e
                messages.append(f"HomeHarvest {location}: {n} new, {u} updated, {e} errors")
            except Exception as exc:
                total_errors += 1
                messages.append(f"HomeHarvest {city} ERROR: {exc}")

        # Deduplication
        try:
            from dedup import run_dedup
            run_dedup()
            messages.append("Dedup completed")
        except Exception as exc:
            messages.append(f"Dedup ERROR: {exc}")

        duration = int((time.time() - start) * 1000)

    sys.stdout.close()
    sys.stdout = old_stdout

    result = {
        "ok": total_errors == 0,
        "city": city,
        "state": state,
        "new": total_new,
        "updated": total_updated,
        "errors": total_errors,
        "duration_ms": duration,
        "messages": messages,
    }
    # Logs to stderr, JSON only to stdout
    for m in messages:
        print(m, file=sys.stderr)
    print(json.dumps(result))
    sys.exit(0 if result["ok"] else 1)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"ok": False, "error": "Usage: ondemand.py <city> <state>"}), file=sys.stderr)
        sys.exit(1)
    run(sys.argv[1], sys.argv[2])
