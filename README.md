# Home Finder

Multi-source real estate listing aggregator. React SPA frontend, PHP JSON API, Python scraper with Playwright.

## Live

- **Host**: `http://10.10.10.111:3013/` (local)
- **Container**: `home-finder` on Docker
- **Database**: `/local/docker/home-finder/data/homefinder.db` (SQLite, host volume)

## Stack

| Layer | Tech |
|-------|------|
| Scraper | Python 3 stdlib `urllib` + Playwright (headless Chromium) |
| LLM | None — no AI/LLM called at runtime |
| Scheduler | Cron inside Docker container |
| Database | SQLite (`listings`, `listing_history`, `scraper_log`, `search_criteria`) |
| API | PHP 8.2 (vanilla PDO) |
| Frontend | React 19 + Vite + React Router + Leaflet + Recharts |
| Server | Apache 2.4 + mod_rewrite |
| Deployment | Docker (`php:8.2-apache` base) |

## API Endpoints

All return `application/json`.

| Endpoint | Params | Description |
|----------|--------|-------------|
| `GET /api/stats.php` | — | Active count, min/max prices |
| `GET /api/filters.php` | — | Distinct cities & states |
| `GET /api/listings.php` | `min_price`, `max_price`, `beds`, `baths`, `lot`, `city`, `state`, `sort`, `page`, `per_page` | Paginated filtered listings |
| `GET /api/listing.php` | `id` | Single listing detail |
| `GET /api/history.php` | `id` | Price history (Recharts line chart data) |

## Source: Redfin

Uses the internal GIS API. See `SOURCES.md` for full list of attempted sources and blocked sites.

```
https://www.redfin.com/stingray/api/gis?al=1&region_id={ID}&region_type=6&pagesize=50&page={N}&v=1
```

JSON requires prefix strip: `lstrip("{}").lstrip("&&")` before `json.loads()`.

Scraper filters to **OR/WA only** at parse time.

## Deploy

```bash
rsync -az --delete ./ raggsy@10.10.10.111:/tmp/home-finder-docker/
ssh raggsy@10.10.10.111 "cd /tmp/home-finder-docker && \
  docker build -t home-finder:latest . && \
  docker stop home-finder && \
  docker rm home-finder && \
  docker run -d --name home-finder \
    -p 3013:80 \
    -v /local/docker/home-finder/data:/app/data \
    -v /local/docker/home-finder/logs:/var/log \
    --restart unless-stopped \
    home-finder:latest"
```

## Known Issues

- **Out-of-state data**: ~2,777 listings in DB are from before the OR/WA state filter was added. Need purge or will dilute filters.
- **Photo URLs**: All `photo_url` fields are NULL; scraper does not yet extract listing images.
- **Playwright unused**: Installed in image but no secondary scrapers written yet (Zillow, LandWatch, etc. all return 403/Cloudflare).
- **Proxy**: Container on `proxy` Docker network (`192.168.1.6`); Nginx Proxy Manager config pending manual port addition.

## Git

`https://github.com/westteck/home-finder` (branch: `main`)
