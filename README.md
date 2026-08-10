# Home Finder

Multi-source real estate listing aggregator for Oregon and Washington. React SPA + PHP API + Python scraper. Runs in Docker on `10.10.10.111:3013`.

## Live

- **Host**: `http://10.10.10.111:3013/`  •  `http://homes.westteck.home/`
- **Container**: `home-finder` (Docker on `111`)
- **DB**: `/local/docker/home-finder/data/homefinder.db` (SQLite)
- **Logs**: `/local/docker/home-finder/logs/`

## Stack

| Layer | Tech |
|-------|------|
| Scraper | Python 3 stdlib urllib (Redfin) + HomeHarvest (Realtor.com) |
| Scheduler | Cron inside Docker |
| Database | SQLite: `listings`, `listing_history`, `saved_searches`, `favorites` |
| API | PHP 8.2 vanilla PDO |
| Frontend | React 19 + Vite + React Router + Leaflet + Recharts |
| Server | Apache 2.4 + mod_rewrite |
| Deployment | Docker (`php:8.2-apache` base) |

## Scrapers

| Source | Method | Status |
|--------|--------|--------|
| Redfin | GIS API (internal JSON) | Active — 37 OR/WA regions |
| Realtor.com | HomeHarvest library | Active — 12 OR/WA cities |
| Zillow | Blocked — Cloudflare bot challenge | Not used |
| LandWatch | Blocked — Cloudflare bot challenge | Not used |

All scrapers filter to **OR/WA only** at parse time. Cross-source deduplication runs after each scrape (groups by `address+city+state`; cheapest is canonical).

## API Endpoints

| Endpoint | Params | Description |
|----------|--------|-------------|
| `GET /api/stats.php` | — | Active count, min/max prices |
| `GET /api/filters.php` | — | Distinct cities & states |
| `GET /api/listings.php` | `min_price`, `max_price`, `beds`, `baths`, `lot`, `city`, `state`, `sort`, `page`, `per_page`, `lat_min`, `lat_max`, `lng_min`, `lng_max`, `all`, `q` | Paginated filtered listings |
| `GET /api/listing.php` | `id` | Single listing detail |
| `GET /api/history.php` | `id` | Price history (`changed_at` timeline) |
| `POST /api/saved_searches.php` | `name`, `filters` JSON | Save current search |
| `GET /api/saved_searches.php` | — | List saved searches |
| `DELETE /api/saved_searches.php` | `id` | Delete saved search |
| `GET /api/preset_search.php` | `type`, `page`, `per_page` | Preset value searches |
| `GET /api/settings.php` | — | Scraper schedule |

### Query Params Reference

- `sort`: `price_asc`, `price_desc`, `beds_desc`, `lot_desc`, `newest`
- `per_page`: Default 50, max 9999
- `lat_min`/`lat_max`/`lng_min`/`lng_max`: Map-bounds filter
- `all=1`: Include duplicate listings

## Preset Searches

One-click filters on Browse page:

| Preset | Description | Count |
|--------|-------------|-------|
| 💰 Best Value | Lowest $/sqft | ~1,841 |
| 💵 Under $150k | Budget-friendly | ~143 |
| 👪 Family Starter | 3+ beds, <$350k | ~164 |
| 🌲 1+ Acre Under $500k | Acreage deals | ~54 |
| 🏞️ 10+ Acres | Big land | ~75 |
| 🔧 Fixer-Upper | Under $100k with sqft | ~69 |
| 📉 Price Drop | Has 2+ price history records | ~1 |

Counts vary with DB size; accurate at runtime.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Browse grid with filters, presets, saved searches, CSV export, favorites |
| `/map` | Leaflet map; "Search this area" renders results inline below map |
| `/listing/:id` | Detail page with specs, price history chart, favorite toggle |
| `/reports` | Price heatmap + charts |
| `/settings` | Source status, data quality, schedule |

## Deploy

```bash
cd frontend && npm run build
cd /home/raggsy/projects/home-finder-docker/www/public/  # Vite dist output
rsync -az --delete ./ raggsy@10.10.10.111:/tmp/hf-public/
ssh raggsy@10.10.10.111 "
  docker cp /tmp/hf-public/. home-finder:/var/www/html/public/ &&
  docker exec home-finder chown -R www-data:www-data /var/www/html/public &&
  docker exec home-finder chmod 644 /var/www/html/public/.htaccess
"
```

Or full rebuild:
```bash
rsync -az --delete ./ raggsy@10.10.10.111:/tmp/home-finder-docker/
ssh raggsy@10.10.10.111 "cd /tmp/home-finder-docker && docker compose build && docker compose up -d --force-recreate"
```

## Known Issues

- **No photos**: React UI renders text-only cards; photo URLs are sparse in source feeds
- **Zillow / LandWatch**: Cloudflare-blocked; not actively scraped
- **Price Drop count**: Only 1 listing has 2+ history records (scraper needs price-change detection)

## Git

`https://github.com/westteck/home-finder` (branch: `main`)

---
*Updated: 2026-08-09*
