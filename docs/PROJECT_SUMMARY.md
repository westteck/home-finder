# Home Finder Docker

Self-hosted housing search app on 10.10.10.111:3013 with safe-area (WA/OR) filtering, saved searches, rentals page, and special homestead/region searches.

## Stack
- Frontend: Vite/React SPA
- Backend: PHP + SQLite
- Container: Docker on 111, volume `/local/docker/home-finder`
- Reverse proxy: NPM at `money.westteck.home` on 8899 (westteck-money)

## Quick Links
- App: http://10.10.10.111:3013
- API: /api/listings.php, /api/preset_search.php, /api/saved_searches.php, /api/special_search.php
- DB: /local/docker/home-finder/data/homefinder.db
- Research: docs/REGION_RESEARCH.md (6 dated cited 2026 region briefs)

## Session History

### 2026-09-22
- Added Special Searches (blue chips on Browse): 🏡 Homestead Hunt (scored /100: acres 35, house 20, beds 15, baths 10, $/acre-efficiency 15, mapped 5), 🌲 N.Clark, 🌋 Cowlitz, 🏔 Lewis, 🍇 Salem, 🌾 Albany, 🌙 Sleeper — all ≤$400k, 1+ acre
- New API www/public/api/special_search.php; region matching by city + county only (guessed rural ZIPs cross-contaminated — removed)
- Scraper coverage 12 → 48 target towns (LOCATIONS in homeharvest_scraper.py); enrichment (garage/stories/year) saved to raw_json; card UI shows garage/story/year + $/acre + score
- Filled county coverage gaps: Cowlitz/Lewis/Marion/Polk/Linn/Benton were empty; container startup scrape populated them; manual sleeper scrape added Cottage Grove (100), Vernonia (55), Millersburg (14) — done as www-data (DB file was owned 1000:1000, chowned to www-data to fix readonly errors)
- Totals at close: homestead 520, n_clark 111, cowlitz 122, lewis 128, salem 83, albany 92, sleeper 391; hourly cron keeps growing all 48 towns
- Wrote docs/REGION_RESEARCH.md — 6 dated/cited 2026 briefs (~16.5k words) from parallel research agents: housing, tax, zoning, healthcare, crime, broadband, small business, risk, USDA, bottom line per region
- Key research findings: $400k below every N Clark town median (zoning there is best-in-state though); Lewis WA = WA value play (Winlock $321.6k, RDD cottage-industry zoning); west-Polk OR value pocket (Willamina $311.8k); avoid EFU zoning in OR ($40k-80k farm-income dwelling rule); top sleepers Halsey $337.6k > Harrisburg > Cottage Grove/Vernonia
- Commits pushed: 6603cfd (special searches + scraper coverage), bcda5b0 (sleeper + REGION_RESEARCH.md)
- Budget tension noted: briefs used $400k ceiling; saved profile says $150-175k via USDA Direct 502 — API accepts min_price/max_price if a "USDA Budget" chip is wanted

### 2026-09-06
- Fixed safe_area filter: replaced hardcoded county whitelist with `state IN ('WA','OR')`
- Verified safe searches return results: 274 WA, 1027 OR, 1030 best_value
- Added Edit/Delete buttons to saved searches dropdown
- Added active-search indicator showing which saved search/preset is applied
- Fixed preset_search.php to apply all filters (state, price, beds, etc.)
- Fixed ENTRYPOINT to background scraper/dedup before Apache starts

## Next Steps
- ~~Add proper county selector for safety filtering if needed~~ (superseded: special_search county matching)
- Consider scraper improvements for rental vs sale tagging
- Optional: "USDA Budget" special chip (min_price/max_price params already supported)
- Optional: per-town median overlays from REGION_RESEARCH.md on search results