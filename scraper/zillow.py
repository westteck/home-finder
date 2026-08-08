"""Zillow scraper via FlareSolverr with embedded JSON extraction."""
import json, re
from fetch import flare_fetch

BASE_URL = "https://www.zillow.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": BASE_URL,
}

def extract_search_results(html: str) -> list[dict]:
    """Pull searchResults JSON out of Next.js hydrated HTML."""
    # Try multiple patterns for embedded JSON
    import re
    # Pattern 1: searchResults key with listResults array
    m = re.search(r'"listResults":(\[.*?\])', html, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass
    # Pattern 2: broader searchResults object
    m = re.search(r'"searchResults":(\{.*?\})', html, re.DOTALL)
    if m:
        try:
            data = json.loads(m.group(1))
            return data.get("listResults", [])
        except json.JSONDecodeError:
            pass
    # Pattern 3: window.__SSR__ or __PRELOADED_STATE__
    for pat in [r'window\.__SSR__\s*=\s*(\{.*?\});',
                r'window\.__PRELOADED_STATE__\s*=\s*(\{.*?\});']:
        m = re.search(pat, html, re.DOTALL)
        if m:
            try:
                data = json.loads(m.group(1))
                sr = data.get("searchResults") or data.get("pageProps", {}).get("searchResults", {})
                return sr.get("listResults", [])
            except json.JSONDecodeError:
                continue
    return []

def parse_listing(z: dict) -> dict | None:
    """Map Zillow listing to our flat schema."""
    zpid = z.get("zpid")
    if not zpid:
        return None

    address = z.get("address", "") or ""
    if not address:
        return None

    # Parse address string "123 Main St, Portland, OR 97201"
    parts = address.split(", ")
    city = parts[-2].strip() if len(parts) >= 3 else ""
    state_zip = parts[-1].strip() if len(parts) >= 2 else ""
    state, zip_ = "", ""
    if state_zip:
        sz = state_zip.split(" ")
        state = sz[0]
        zip_ = sz[-1] if len(sz) > 1 else ""

    # Strictly only OR/WA
    if state not in ("OR", "WA"):
        return None

    price_raw = z.get("unformattedPrice") or 0
    beds = z.get("beds") or z.get("bedrooms") or 0
    baths = z.get("baths") or z.get("bathrooms") or 0
    sqft = z.get("area") or z.get("sqft") or 0
    lot_size = z.get("lotAreaValue") or 0
    photo = z.get("imgSrc", "")
    url_full = z.get("detailUrl", "")
    if url_full and not url_full.startswith("http"):
        url_full = f"{BASE_URL}{url_full}"

    lat = z.get("latLong", {}).get("latitude") or z.get("latitude")
    lng = z.get("latLong", {}).get("longitude") or z.get("longitude")

    return {
        "source_id": str(zpid),
        "mls_id": z.get("mlsid", ""),
        "status": z.get("statusType", ""),
        "price": price_raw,
        "beds": beds,
        "baths": baths,
        "sqft": sqft,
        "lot_size_sqft": 0,  # Zillow doesn't expose lot_sqft in this endpoint
        "address": address,
        "city": city,
        "state": state,
        "zip": zip_,
        "county": "",
        "url": url_full,
        "photo_url": photo,
        "listed_date": "",
        "latitude": lat,
        "longitude": lng,
        "raw_json": json.dumps(z),
    }

def run_region(db, city: str, state: str, max_results: int = 100) -> tuple[int, int, int]:
    """Fetch Zillow search results via FlareSolverr."""
    from db import upsert_listing

    slug = f"{city.replace(' ', '-').replace(',', '')}-{state}"
    url = f"{BASE_URL}/homes/{slug}_rb/?searchQueryState=%7B%22pagination%22%3A%7B%7D%2C%22usersSearchTerm%22%3A%22{city}%2C%20{state}%22%2C%22filterState%22%3A%7B%22fr%22%3A%7B%22value%22%3Atrue%7D%7D%7D"

    try:
        html = flare_fetch(url)
    except Exception:
        return 0, 0, 0

    results = extract_search_results(html)
    new_count = updated_count = error_count = 0
    for z in results[:max_results]:
        flat = parse_listing(z)
        if not flat:
            continue
        try:
            n, u = upsert_listing(db, "zillow", flat)
            new_count += n
            updated_count += u
        except Exception:
            error_count += 1

    return new_count, updated_count, error_count

def run(db, max_results: int = 100) -> tuple[int, int, int]:
    """Scrape Zillow for The Dalles and a few key targets."""
    targets = [
        ("The Dalles", "OR"),
        ("Portland", "OR"),
        ("Bend", "OR"),
        ("Seattle", "WA"),
        ("Vancouver", "WA"),
    ]
    total_new = total_updated = total_errors = 0
    for city, state in targets:
        n, u, e = run_region(db, city, state, max_results=max_results)
        total_new += n
        total_updated += u
        total_errors += e
        print(f"  Zillow {city}: {n} new, {u} updated, {e} errors")
    return total_new, total_updated, total_errors
