# Home Finder

## What This Is

Personal real estate listing scraper and aggregator. Monitors configured sources for new/updated property listings, stores them in a local database, and surfaces matches via a React web UI. For personal house hunting only — no public access, no user accounts.

## Core Value

Never miss a new listing that matches your criteria because you forgot to check six different sites.

## Requirements

### Validated (Shipped)

- Scraper: Redfin GIS API (37 OR/WA regions) via Python stdlib `urllib`
- Database: SQLite with deduplication (`listings`, `listing_history`, `scraper_log`)
- Filter by user-defined criteria: price, beds, baths, city, state, sort, pagination
- Web UI: React SPA (Vite) with map (Leaflet), price history chart (Recharts), detail page, CSV export
- Cron-scheduled scraping: hourly inside Docker container
- Docker deploy: container on 111:3013 with host volume for DB/logs

### In Progress

- [ ] OR/WA state filter applied to new scrapes only; need purge of existing out-of-state rows
- [ ] Playwright installed but no secondary scrapers written yet

### Out of Scope

- Multi-user / authentication — personal use only
- Mobile app — responsive web SPA is sufficient
- Real-time push — CSV export + manual refresh only
- Automatic offer / contact features — view-only aggregator

## Context

- Runs in Docker on `111` (`10.10.10.111:3013`), Apache/PHP + Python
- Originally prototyped on Debian Mini local Apache
- Migrated to Docker for portability and Playwright support
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
| Redfin GIS API over HTML scraping | Reliable JSON payload, no Cloudflare | Working |
| OR/WA filter at scraper parse time | Prevents out-of-state DB pollution | Code live; DB cleanup pending |
| Playwright in container image | Attempt secondary sources (403/CF blocked) | Installed, unused |
| Vite `emptyOutDir: false` | Preserve `www/public/api/*.php` during static build | Working |

## Repo

https://github.com/westteck/home-finder (branch `main`)

---
*Last updated: 2026-08-07 after React SPA + Docker deploy*
