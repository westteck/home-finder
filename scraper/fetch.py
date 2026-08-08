"""Generic fetcher with FlareSolverr fallback for Cloudflare-blocked sites."""
import json, urllib.request

FLARE_URL = "http://flaresolverr:8191/v1"

def direct_fetch(url, headers=None, timeout=30):
    req = urllib.request.Request(url, headers=headers or {"User-Agent":"Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode()

def flare_fetch(url, flare_url=FLARE_URL, max_timeout=120000):
    payload = json.dumps({
        "cmd": "request.get",
        "url": url,
        "maxTimeout": max_timeout
    }).encode()
    req = urllib.request.Request(flare_url, data=payload, headers={"Content-Type":"application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=max_timeout/1000 + 30) as resp:
        data = json.loads(resp.read())
    solution = data.get("solution", {})
    return solution.get("response", "")

def fetch(url, headers=None, flare_fallback=True, flare_url=FLARE_URL):
    """Try direct fetch; fall back to FlareSolverr on HTTPError 403/429/5xx."""
    try:
        return direct_fetch(url, headers=headers), None
    except urllib.error.HTTPError as e:
        if flare_fallback and e.code in (403, 429, 503, 502, 500):
            try:
                return flare_fetch(url, flare_url=flare_url), "flaresolverr"
            except Exception:
                pass
        raise
    except Exception:
        if flare_fallback:
            try:
                return flare_fetch(url, flare_url=flare_url), "flaresolverr"
            except Exception:
                pass
        raise
