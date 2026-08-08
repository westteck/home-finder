# Home Finder

## What This Is

Personal real estate listing scraper and aggregator for Oregon and Washington listings. Monitors multiple sources, stores them in a local SQLite database, and surfaces matches via a React web UI. For personal house hunting only — no public access, no user accounts.

## Core Value

Never miss a new listing that matches your criteria because you forgot to check multiple sites (Redfin, Realtor.com, etc.).

## Requirements

### Shipped

- **Scrapers**: Redfin GIS API (37 OR/WA regions) + Realtor.com via HomeHarvest (12 OR/WA cities)
- **Deduplication**: Cross-source duplicate detection (group by `address+city+state`, canonical = cheapest)
- **Database**: SQLite with `listings`, `listing_history`, `scraper_log`, `search_criteria`, `favorites`
- **Filters**: Price, beds, baths, city, state, sort, pagination, map bounds
- **Browse**: Grid layout with cards, sort, pagination, saved searches dropdown, CSV export
- **Map**: Leaflet markers with "Search this area" button — navigates to Browse with bounds
- **Detail**: Photo placeholder, specs, price history Recharts chart, favorite toggle
- **Favorites**: ⭐ button on cards; per-device via localStorage username
- **Saved searches**: Stored in SQLite; apply via dropdown under filters
- **Reports**: Price heatmap + charts
- **Cron**: Hourly scrape + auto-dedup inside Docker container
- **Docker deploy**: Container on `111:3013` with host volume for DB/logs

### In Progress

- Photo URL extraction (some Redfin, none from HomeHarvest yet)
- Digest alerts (new matching listings → Telegram)

### Out of Scope

- Multi-user / authentication — personal use only
- Mobile app — responsive web SPA is sufficient
- Real-time push — manual refresh + CSV export
- Automatic offer / contact features — view-only aggregator

## Context

- Runs in Docker on `111` (`10.10.10.111:3013`), Apache/PHP + Python
- Originally prototyped on Debian Mini local Apache
- Migrated to Docker for portability
- Container attached to `proxy` network for Nginx Proxy Manager integration

## Constraints

- **Tech**: Python 3 (scraping) + SQLite (storage) + PHP JSON API + React SPA
- **Runtime**: Docker container with cron, no external cloud dependencies
- **Rate limits**: Respect target sites (delay, rotate UA, cap retries)
- **Legal**: Personal use only; terms-of-service aware scraping

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React SPA over PHP server-render | User directive; richer interactivity | Shipped |
| Redfin GIS API over HTML scraping | Reliable JSON payload, no Cloudflare | Working well |
| OR/WA filter at scraper parse time | Prevents out-of-state DB pollution | Working |
| HomeHarvest (Realtor.com) over hand-rolled Zillow | Purpose-built library, no Cloudflare issues | Working; 1,176 OR/WA listings ingested |
| Deduplication by address+price | Same address on Redfin + Realtor.com = duplicate | Working; 495 duplicates hidden |
| Vite `emptyOutDir: false` | Preserve `www/public/api/*.php` during static build | Working |
| `--system-site-packages` venv + `apt python3-pandas` | Avoid numpy compile crash on ARM Mac Mini + Rosetta | Working |

## Repo

`https://github.com/westteck/home-finder` (branch `main`)

---
*Last updated: 2026-08-07 after dedup + map bounds feature*
