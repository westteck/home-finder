# Home Finder — Status

## What's Live

| Feature | Status | Notes |
|---------|--------|-------|
| React SPA | LIVE | Browse, filter, sort, map, detail view, price history chart, CSV export, favorites, saved searches |
| PHP API | LIVE | 8+ endpoints returning JSON |
| Redfin scraper | LIVE | 37 OR/WA regions via GIS API |
| Realtor.com scraper | LIVE | 12 OR/WA cities via HomeHarvest |
| Deduplication | LIVE | Auto-runs after each scrape; 522 dupes hidden |
| OR/WA filter | LIVE | Filters all new scrapes |
| Map bounds search | LIVE | "Search this area" renders results inline below map |
| Preset searches | LIVE | 7 one-click filters on Browse page |
| Saved searches | LIVE | Save from Browse; dropdown to re-apply |
| Cron | LIVE | Hourly scrape + dedup inside container |
| Docker deploy | LIVE | Port 3013 on 111; accessible via `homes.westteck.home` |
| Playwright | INSTALLED | In container; unused (Zillow/LandWatch blocked) |

## Data (as of latest scrape)

- **Total listings**: 2,468
- **Canonical listings**: 1,946
- **Hidden duplicates**: 522
- **Saved searches**: 3
- **With lat/lng**: 1,583
- **Price history rows**: 148
- **OR/WA coverage**: Primary focus; some earlier out-of-state rows remain from before state filter

## Open Items

1. Scraper price-change detection → populate `listing_history` with records
2. Telegram digest alerts for new matching listings
3. GitHub CI / automated deploy script

## Architecture

```
111:3013 → Docker → Apache
  ├── SPA static (React/Vite) → /, /map, /listing/:id, /reports, /settings
  ├── API PHP → /api/*.php → SQLite PDO → /app/data/homefinder.db
  └── Cron → python3 /app/scraper/main.py + /app/scraper/dedup.py
```

Nginx Proxy Manager (`111:443`) proxies `homes.westteck.home` → `home-finder:80` via shared `proxy` network.

## Repo

`https://github.com/westteck/home-finder` (branch main)

---
*Last updated: 2026-08-09*
