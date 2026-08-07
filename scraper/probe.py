import requests, json, sys

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
}

for url in ["https://landmoto.com", "https://www.landmoto.com", "https://landmoto.com/listings"]:
    try:
        r = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        print(f"URL: {r.url}")
        print(f"Status: {r.status_code}")
        print(f"Server: {r.headers.get('Server', 'N/A')}")
        print(f"Content-Type: {r.headers.get('Content-Type', 'N/A')}")
        print(f"Content length: {len(r.text)}")
        text = r.text[:2000]
        if "json" in text.lower() or "window.__" in text or "data" in text[:500]:
            print(f"Preview: {text[:800]}")
        else:
            print(f"Preview (first 400 chars): {text[:400].strip()}")
        print("-" * 40)
    except Exception as e:
        print(f"ERROR {url}: {e}")
        print("-" * 40)
