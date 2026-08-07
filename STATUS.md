# Home Finder — Status

## What's Live

| Feature | Status | Notes |
|---------|--------|-------|
| React SPA | LIVE | Browse, filter, sort, map, detail view, price history chart, CSV export |
| PHP API | LIVE | 5 endpoints returning JSON |
| Redfin scraper | LIVE | 37 OR/WA regions via GIS API |
| OR/WA filter | CODE READY | Filters new scrapes; existing DB rows not purged yet |
| Playwright | INSTALLED | In container image; no secondary scrapers written yet |
| Cron | LIVE | Hourly scrape inside container |
| Docker deploy | LIVE | Port 3013 on 111 |

## Open Items

1. Purge out-of-state listings from DB (2,777 → OR/WA only)
2. Add photo_url extraction to Redfin scraper
3. Write Playwright-based scrapers for Zillow / LandWatch / Realtor
4. Wire digest alerts (new matches email/Telegram)
5. Nginx Proxy Manager host config for `homes.westteck.home`
6. GitHub CI / automated deploy script

## Architecture

```
111:3013 → Docker → Apache
  ├── SPA static (React/Vite) → /, /listing/:id, /reports
  ├── API PHP → /api/*.php → SQLite PDO → /app/data/homefinder.db
  └── Cron → python3 /app/scraper/main.py → Redfin GIS API
```

## Repo

https://github.com/westteck/home-finder (branch main)

---
*Last updated: 2026-08-07*
