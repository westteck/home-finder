"""Realtor.com scraper via HomeHarvest library (ZacharyHampton/HomeHarvest).
Scrapes Realtor.com internal API — no Cloudflare, no headless browser needed.
"""
import json

try:
    from homeharvest import scrape_property
except ImportError:
    scrape_property = None

# Target towns for the 2026 homestead hunt: Clark/Cowlitz/Lewis WA + Salem Polk-Marion + Albany Linn-Benton OR
# Full list with regions in target_towns.py
LOCATIONS = [
    "Battle Ground, WA", "Brush Prairie, WA", "Hockinson, WA", "Ridgefield, WA",
    "La Center, WA", "Yacolt, WA", "Amboy, WA", "Vancouver, WA",
    "Woodland, WA", "Kalama, WA", "Castle Rock, WA", "Longview, WA", "Kelso, WA",
    "Toutle, WA", "Vader, WA", "Ryderwood, WA",
    "Centralia, WA", "Chehalis, WA", "Napavine, WA", "Winlock, WA", "Toledo, WA",
    "Mossyrock, WA", "Onalaska, WA",
    "Salem, OR", "Dallas, OR", "Monmouth, OR", "Independence, OR", "Turner, OR",
    "Aumsville, OR", "Silverton, OR", "Stayton, OR", "Sublimity, OR", "Jefferson, OR",
    "Albany, OR", "Lebanon, OR", "Philomath, OR", "Adair Village, OR", "Tangent, OR",
    "Brownsville, OR", "Halsey, OR", "Harrisburg, OR", "Monroe, OR", "Scio, OR",
    "Sodaville, OR", "Crawfordsville, OR", "Corvallis, OR",
    # Sleeper-search towns
    "Cottage Grove, OR", "Vernonia, OR", "Millersburg, OR",
]

def parse_row(row) -> dict | None:
    """Map a HomeHarvest DataFrame row to our flat schema."""
    state = row.get("state", "")
    if state not in ("OR", "WA"):
        return None
    photo_url = row.get("primary_photo") or ""
    alt_photos = row.get("alt_photos") or ""
    if not photo_url and alt_photos:
        # alt_photos is a comma-separated string
        photo_url = alt_photos.split(",")[0].strip()

    baths = row.get("full_baths") or 0
    half = row.get("half_baths") or 0
    if half:
        baths = (baths or 0) + (half / 2.0)

    return {
        "source_id": str(row.get("property_id") or row.get("listing_id") or ""),
        "mls_id": row.get("mls_id") or "",
        "status": row.get("mls_status") or row.get("status") or "",
        "price": row.get("list_price") or 0,
        "beds": row.get("beds"),
        "baths": baths,
        "sqft": row.get("sqft") or 0,
        "lot_size_sqft": row.get("lot_sqft") or 0,
        "address": row.get("formatted_address") or row.get("full_street_line") or "",
        "city": row.get("city") or "",
        "state": state,
        "zip": str(row.get("zip_code") or ""),
        "county": row.get("county") or "",
        "url": row.get("property_url") or "",
        "photo_url": photo_url,
        "listed_date": str(row.get("list_date") or ""),
        "latitude": row.get("latitude"),
        "longitude": row.get("longitude"),
        "raw_json": json.dumps({
            k: (None if v is None or (isinstance(v, float) and v != v) else v)
            for k, v in row.items()
            if k in ("garage_spaces", "parking_spaces", "story_number", "stories", "year_built",
                     "lot_sqft", "price_per_sqft", "primary_photo", "alt_photos", "text", "description")
        }),
    }

def run_region(db, location: str, limit: int = 100) -> tuple[int, int, int]:
    """Scrape Realtor.com for a single location via HomeHarvest."""
    from db import upsert_listing
    if scrape_property is None:
        print(f"  HomeHarvest not installed, skipping {location}")
        return 0, 0, 0
    try:
        df = scrape_property(
            location=location,
            listing_type="for_sale",
            limit=limit,
        )
        print(f"  HomeHarvest {location}: fetched {len(df)} rows")
    except Exception as exc:
        print(f"  HomeHarvest {location} ERROR: {exc}")
        return 0, 0, 1

    new_count = updated_count = error_count = 0
    for _, row in df.iterrows():
        flat = parse_row(row.to_dict())
        if not flat:
            continue
        try:
            n, u = upsert_listing(db, "homeharvest", flat)
            new_count += n
            updated_count += u
        except Exception:
            error_count += 1
    return new_count, updated_count, error_count

def run(db) -> tuple[int, int, int]:
    """Scrape all regions via HomeHarvest."""
    total_new = total_updated = total_errors = 0
    for loc in LOCATIONS:
        n, u, e = run_region(db, loc)
        total_new += n
        total_updated += u
        total_errors += e
        print(f"  HomeHarvest {loc}: {n} new, {u} updated, {e} errors")
    return total_new, total_updated, total_errors
