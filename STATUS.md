# Home Finder — Status

## What's Live

| Feature | Status | Notes |
|---------|--------|-------|
| React SPA | LIVE | Browse, filter, sort, map, detail view, price history chart, CSV export, favorites, saved searches |
| PHP API | LIVE | 8 endpoints returning JSON |
| Redfin scraper | LIVE | 37 OR/WA regions via GIS API |
| Realtor.com scraper | LIVE | 12 OR/WA cities via HomeHarvest |
| Deduplication | LIVE | Auto-runs after each scrape; 495 dupes hidden, 1,431 canonical |
| OR/WA filter | LIVE | Filters all new scrapes |
| Map bounds search | LIVE | "Search this area" on map navigates to Browse with bounds filter |
| Playwright | INSTALLED | In container image; unused (Zillow/LandWatch blocked) |
| Cron | LIVE | Hourly scrape + dedup inside container |
| Docker deploy | LIVE | Port 3013 on 111; deployed via `docker compose up -d --force-recreate` |
| Saved searches | LIVE | Dropdown under filters; stores price/city/state/beds/baths criteria |
| Favorites | LIVE | ⭐ button on cards; persisted per-device via `localStorage` username |

## Data

- **Total listings (with dupes)**: ~1,926
- **Canonical listings**: ~1,431
- **Hidden duplicates**: ~495 (shown with `all=1` or "Show duplicates" checkbox)
- **OR/WA coverage**: Primary focus; some earlier out-of-state rows remain in DB from before state filter

## Open Items

1. Add photo_url extraction to Redfin and HomeHarvest scrapers
2. Wire digest alerts (new matching listings → Telegram)
3. Nginx Proxy Manager host config for `homes.westteck.home`
4. GitHub CI / automated deploy script

## Architecture

```
111:3013 → Docker → Apache
  ├── SPA static (React/Vite) → /, /map, /listing/:id, /reports, /settings
  ├── API PHP → /api/*.php → SQLite PDO → /app/data/homefinder.db
  └── Cron → python3 /app/scraper/main.py + /app/scraper/dedup.py
```

## Repo

`https://github.com/westteck/home-finder` (branch main)

---
*Last updated: 2026-08-07*
