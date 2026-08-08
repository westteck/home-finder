# Home Finder

Multi-source real estate listing aggregator for Oregon and Washington. React SPA frontend, PHP JSON API, Python scraper.

## Live

- **Host**: `http://10.10.10.111:3013/` (local network)
- **Container**: `home-finder` on Docker
- **Database**: `/local/docker/home-finder/data/homefinder.db` (SQLite, host volume)
- **Logs**: `/local/docker/home-finder/logs/`

## Stack

| Layer | Tech |
|-------|------|
| Scraper | Python 3 stdlib urllib + HomeHarvest (Realtor.com) |
| Scheduler | Cron inside Docker container |
| Database | SQLite (`listings`, `listing_history`, `scraper_log`, `search_criteria`, `favorites`) |
| API | PHP 8.2 (vanilla PDO) |
| Frontend | React 19 + Vite + React Router + Leaflet + Recharts |
| Server | Apache 2.4 + mod_rewrite |
| Deployment | Docker (`php:8.2-apache` base) |

## Scrapers

| Source | Method | Status |
|--------|--------|--------|
| Redfin | GIS API (internal JSON) | Active — 37 OR/WA regions |
| Realtor.com | HomeHarvest library (pandas) | Active — 12 OR/WA cities |

All scrapers filter to **OR/WA only** at parse time. Cross-source deduplication runs after each scrape (groups by `address+city+state`, cheapest listing is canonical).

## API Endpoints

All return `application/json`.

| Endpoint | Params | Description |
|----------|--------|-------------|
| `GET /api/stats.php` | — | Active count, min/max prices |
| `GET /api/filters.php` | — | Distinct cities & states |
| `GET /api/listings.php` | `min_price`, `max_price`, `beds`, `baths`, `lot`, `city`, `state`, `sort`, `page`, `per_page`, `lat_min`, `lat_max`, `lng_min`, `lng_max`, `all`, `q` | Paginated filtered listings |
| `GET /api/listing.php` | `id` | Single listing detail |
| `GET /api/history.php` | `id` | Price history (Recharts line chart data) |
| `GET /api/favorites.php` | — | User favorites |
| `POST /api/favorites.php` | `listing_id` | Add favorite |
| `DELETE /api/favorites.php` | `listing_id` | Remove favorite |

### API Params Reference

- **`sort`**: `price_asc`, `price_desc`, `beds_desc`, `lot_desc`, `newest`
- **`per_page`**: Default 50, max 9999
- **`lat_min`, `lat_max`, `lng_min`, `lng_max`**: Map-bounds filtering (used by "Search this area" feature)
- **`all=1`**: Include duplicate listings (default hides duplicates; shows canonical cheapest)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Browse grid with filters, saved searches, CSV export, favorites |
| `/map` | Leaflet map with markers; "Search this area" button navigates to `/` with bounds |
| `/listing/:id` | Detail page with photos (if available), specs, price history chart, favorite toggle |
| `/reports` | Price heatmap + charts |
| `/settings` | Source status, data quality, saved searches manager |

## Deploy

```bash
rsync -az --delete ./ raggsy@10.10.10.111:/tmp/home-finder-docker/
ssh raggsy@10.10.10.111 "cd /tmp/home-finder-docker && \
  docker compose build && \
  docker compose up -d --force-recreate"
```

## Known Issues

- **Photo URLs**: Most `photo_url` fields are NULL; only Redfin provides some extraction, Realtor.com provides primary_photo but is not mapped to `photo_url` yet.
- **Zillow blocked**: Cloudflare + JS-rendered. Playwright installed but not used for Zillow yet.
- **LandWatch blocked**: 403 / bot challenge.

## Git

`https://github.com/westteck/home-finder` (branch: `main`)
