import json, re, time
from urllib.request import Request, urlopen

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

HEADERS = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

CL_SEARCHES = [
    "https://bend.craigslist.org/search/rea?query=the+dalles",
    "https://portland.craigslist.org/search/rea?query=the+dalles",
]


def fetch_search(url: str) -> str:
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=20) as resp:
        raw = resp.read()
        import gzip
        if raw[:2] == b'\x1f\x8b':
            raw = gzip.decompress(raw)
        return raw.decode("utf-8", errors="replace")


def extract_json_data(html: str) -> list[dict]:
    """Craigslist embeds listing data in window.searchPageData or similar JSON blob."""
    # Look for data in script tags
    listings = []
    for match in re.finditer(r'<script\s+type="application/ld\+json"\s*>(.*?)</script>', html, re.DOTALL):
        try:
            data = json.loads(match.group(1))
            if isinstance(data, list):
                for item in data:
                    if item.get("@type") == "SingleFamilyResidence":
                        listings.append(parse_ld_json(item))
            elif data.get("@type") == "SearchResultsPage":
                for item in data.get("mainEntity", {}).get("itemListElement", []):
                    listings.append(parse_item(item))
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
    return [l for l in listings if l]


def parse_ld_json(item: dict) -> dict | None:
    try:
        price = 0
        if item.get("price") and isinstance(item["price"], str):
            try: price = int(item["price"].replace("$", "").replace(",", "").strip())
            except: pass
        return {
            "source_id": item.get("url", "").strip("/").split("/")[-1].replace(".html", ""),
            "mls_id": "",
            "status": "Active",
            "price": price,
            "beds": item.get("numberOfBedrooms"),
            "baths": item.get("numberOfBathroomsTotal"),
            "sqft": item.get("floorSize", {}).get("value") if isinstance(item.get("floorSize"), dict) else None,
            "lot_size_sqft": None,
            "address": item.get("name", item.get("address", {}).get("streetAddress", "")),
            "city": item.get("address", {}).get("addressLocality", ""),
            "state": item.get("address", {}).get("addressRegion", ""),
            "zip": item.get("address", {}).get("postalCode", ""),
            "county": "",
            "url": item.get("url", ""),
            "photo_url": item.get("image") if isinstance(item.get("image"), str) else (item.get("image", [{}])[0] if isinstance(item.get("image"), list) else None),
            "listed_date": item.get("datePosted", ""),
            "latitude": item.get("geo", {}).get("latitude"),
            "longitude": item.get("geo", {}).get("longitude"),
            "raw_json": json.dumps(item),
        }
    except Exception:
        return None


def parse_item(item: dict) -> dict | None:
    return parse_ld_json(item)


def parse_search_html(html: str) -> list[dict]:
    """Fallback: parse HTML li.result-row elements."""
    listings = []
    for match in re.finditer(r'<li\s+class="result-row"\s+data-pid="([^"]+)"[^]*?<a\s+href="([^"]+)"[^]*?<span\s+class="result-price"\s*>([^]*?)</span>[^]*?<span\s+class="result-hood"\s*>([^]*?)</span>[^]*?<span\s+class="result-body"\s*>([^]*?)</span>', html):
        pid, link, price_text, hood, body = match.groups()
        price = 0
        try:
            price = int(re.sub(r'[^\d]', '', price_text))
        except (ValueError, IndexError):
            pass

        # Extract beds/baths/text from body
        beds = baths = sqft = None
        if "br" in body.lower():
            m = re.search(r'(\d+(?:\.\d+)?)\s*br', body, re.IGNORECASE)
            if m: beds = float(m.group(1))
        if "ba" in body.lower():
            m = re.search(r'(\d+(?:\.\d+)?)\s*ba', body, re.IGNORECASE)
            if m: baths = float(m.group(1))
        if "ft" in body.lower():
            m = re.search(r'(\d[\d,]*)\s*ft', body, re.IGNORECASE)
            if m: sqft = int(m.group(1).replace(",", ""))

        title = re.sub(r'<[^]+>', ' ', body).strip()

        listings.append({
            "source_id": pid,
            "mls_id": "",
            "status": "Active",
            "price": price,
            "beds": beds,
            "baths": baths,
            "sqft": sqft,
            "lot_size_sqft": None,
            "address": title,
            "city": hood.strip(" ()"),
            "state": "OR",
            "zip": "",
            "county": "",
            "url": link if link.startswith("http") else f"https://bend.craigslist.org{link}",
            "photo_url": None,
            "listed_date": "",
            "latitude": None,
            "longitude": None,
            "raw_json": json.dumps({"pid": pid, "title": title, "price": price}),
        })
    return listings


def run(db):
    from db import upsert_listing
    total_new = total_updated = total_errors = 0
    for url in CL_SEARCHES:
        try:
            html = fetch_search(url)
            listings = extract_json_data(html)
            if not listings:
                listings = parse_search_html(html)
            for flat in listings:
                try:
                    n, u = upsert_listing(db, "craigslist", flat)
                    total_new += n
                    total_updated += u
                except Exception:
                    total_errors += 1
            print(f"  craigslist ({url.split('/')[2]}): {len(listings)} items")
            time.sleep(2)
        except Exception as e:
            print(f"  ERROR craigslist: {e}")
            total_errors += 1
    return total_new, total_updated, total_errors
