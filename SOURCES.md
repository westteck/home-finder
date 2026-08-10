# Sources

## Active

| Source | Tech | Coverage | Listings | Notes |
|--------|------|----------|----------|-------|
| Redfin GIS API | `urllib` + JSON parse | 37 OR/WA regions | ~1,052 (of 2,468 total) | Internal GIS endpoint, no rate limit observed |
| Realtor.com (HomeHarvest) | `homeharvest` library | 12 OR/WA cities | ~1,416 (of 2,468 total) | Returns structured data; no API key needed |

## Blocked

| Source | Reason | Status |
|--------|--------|--------|
| Zillow.com | Cloudflare bot challenge + JS-rendered | Blocked 🚫 |
| LandWatch.com | Cloudflare bot challenge | Blocked 🚫 |

## Database Distribution

- **2,468 total rows** (includes 522 hidden duplicates)
- **1,946 canonical** (cheapest per `address+city+state`)
- **1,583 have latitude/longitude** (backfilled from `raw_json`)

## Photo URLs

- **NULL for ~95%** of listings
- Redfin provides some primary_photo URLs in `raw_json`
- HomeHarvest `primary_photo` is not mapped to `photo_url` column
- UI renders text-only cards by design (photos were disabled per user request)

## Deduplication Logic

```
GROUP BY address || city || state
  → cheapest listing_id = is_canonical = 1
  → others = is_canonical = 0 (hidden by default)
  → `all=1` param or "Show duplicates" checkbox reveals all
```

Auto-runs after every scrape via `scraper/dedup.py`.

---
*Updated: 2026-08-09*
