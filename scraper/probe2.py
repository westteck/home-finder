import requests, json, sys

headers = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

for url in ["https://landmoto.com", "http://landmoto.com"]:
    try:
        r = requests.get(url, headers=headers, timeout=15, allow_redirects=True, verify=False)
        print(f"URL: {r.url}")
        print(f"Status: {r.status_code}")
        print(f"Server: {r.headers.get('Server', 'N/A')}")
        print(f"CF-Ray: {r.headers.get('CF-RAY', 'N/A')}")
        print(f"Content-Type: {r.headers.get('Content-Type', 'N/A')}")
        print(f"Content length: {len(r.text)}")
        print(f"Preview (first 500 chars): {r.text[:500].strip()}")
        print("-" * 40)
    except Exception as e:
        print(f"ERROR {url}: {e}")
        print("-" * 40)
