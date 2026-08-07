import json, time, random
from urllib.request import Request, urlopen
from urllib.parse import urlencode

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.redfin.com/",
}

PAGESIZE = 50


def fetch_region(region_id: int, region_type: int = 6) -> list[dict]:
    """Fetch every page from Redfin GIS for the given region."""
    out: list[dict] = []
    seen_ids: set[str] = set()
    page = 1
    while True:
        params = {
            "al": "1",
            "region_id": str(region_id),
            "region_type": str(region_type),
            "pagesize": str(PAGESIZE),
            "page": str(page),
            "v": "1",
        }
        url = f"https://www.redfin.com/stingray/api/gis?{urlencode(params)}"
        req = Request(url, headers=HEADERS)
        with urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
        body = raw.lstrip("{}")
        if body.startswith("&&"):
            body = body[2:]
        data = json.loads(body)
        homes = data.get("payload", {}).get("homes", [])
        if not homes:
            break
        new_homes = [h for h in homes if str(h.get("listingId", h.get("id", ""))) not in seen_ids]
        if not new_homes:
            break
        out.extend(new_homes)
        seen_ids.update(str(h.get("listingId", h.get("id", ""))) for h in new_homes)
        if len(homes) < PAGESIZE:
            break
        page += 1
        time.sleep(random.uniform(1.0, 2.0))  # polite
    return out


def parse_home(h: dict):
    try:
        street_line = h.get("streetLine", {})
        if isinstance(street_line, dict):
            address = (street_line.get("value") or "").strip()
        else:
            address = ""
        if not address:
            return None

        state = h.get("state", "") or ""
        if state not in ("OR", "WA"):
            return None

        lat_lon = h.get("latLong", {}).get("value", {}) or {}
        price_dict = h.get("price", {})
        price = (price_dict.get("value") if isinstance(price_dict, dict) else None) or 0

        beds = h.get("beds")
        baths = h.get("baths")
        sqft_dict = h.get("sqFt", {})
        sqft = (sqft_dict.get("value") if isinstance(sqft_dict, dict) else None) or 0
        lot_dict = h.get("lotSize", {})
        lot_size_sqft = (lot_dict.get("value") if isinstance(lot_dict, dict) else None) or 0

        city = h.get("city", "") or ""
        state = h.get("state", "") or ""
        zip_val = h.get("zip", "") or ""
        postal = h.get("postalCode", {})
        if isinstance(postal, dict) and postal.get("value"):
            zip_val = postal.get("value")

        county = h.get("county", "") or ""

        mls_id_dict = h.get("mlsId", {})
        mls_id = (mls_id_dict.get("value") if isinstance(mls_id_dict, dict) else None) or ""

        photo_url = None
        photo_format = h.get("photoFormat", "webp")
        property_id = h.get("propertyId")
        listing_id = h.get("listingId")
        if property_id and listing_id and h.get("numPictures", 0) > 0:
            photo_url = f"https://ssl.cdn-redfin.com/photo/{photo_format}/generecVersionNo/10/{listing_id}_{property_id}_0_generecVersionno.jpg"

        url_full = h.get("url", "")
        if url_full and not url_full.startswith("http"):
            url_full = f"https://www.redfin.com{url_full}"

        return {
            "source_id": str(h.get("listingId") or h.get("id") or ""),
            "mls_id": mls_id,
            "status": h.get("mlsStatus", ""),
            "price": price,
            "beds": beds,
            "baths": baths,
            "sqft": sqft,
            "lot_size_sqft": lot_size_sqft,
            "address": address,
            "city": city,
            "state": state,
            "zip": zip_val,
            "county": county,
            "url": url_full,
            "photo_url": photo_url,
            "listed_date": h.get("listingDate", ""),
            "latitude": lat_lon.get("latitude"),
            "longitude": lat_lon.get("longitude"),
            "raw_json": json.dumps(h),
        }
    except Exception:
        return None


def run_region(db, region_id: int, city: str, state: str) -> tuple[int, int, int]:
    """Fetch and upsert a single region.
    Returns (new_count, updated_count, error_count)."""
    from db import upsert_listing
    source_key = f"{state.lower()}-{city.lower().replace(' ', '-')}-{region_id}"
    raw = fetch_region(region_id, 6)
    homes = [h for h in (parse_home(x) for x in raw) if h]
    new_count = updated_count = error_count = 0
    for flat in homes:
        try:
            # Override city/state in case Redfin returned blanks
            if not flat.get("city"):
                flat["city"] = city
            if not flat.get("state"):
                flat["state"] = state
            n, u = upsert_listing(db, source_key, flat)
            new_count += n
            updated_count += u
        except Exception:
            error_count += 1
    return new_count, updated_count, error_count


def run(db, region_ids: list[int] | None = None) -> tuple[int, int, int]:
    """Run Redfin scraper for all or selected regions.
    If region_ids is None, scrape all regions from regions.py."""
    from regions import REGIONS
    if region_ids is None:
        region_ids = list(REGIONS.keys())
    total_new = total_updated = total_errors = 0
    for rid in region_ids:
        city, state = REGIONS[rid]
        n, u, e = run_region(db, rid, city, state)
        total_new += n
        total_updated += u
        total_errors += e
        print(f"  {city}, {state}: {n} new, {u} updated, {e} errors")
    return total_new, total_updated, total_errors
