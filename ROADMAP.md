# ROADMAP: Home Finder

## Overview

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Scraper skeleton + SQLite schema + first source | DONE |
| Phase 2 | Multi-region + deduplication + data integrity | DONE |
| Phase 3 | React SPA (browse, sort, filter, map, detail, history chart, export) | DONE |
| Phase 4 | Docker container + cron + dedup + dual scrapers | DONE |
| Phase 5 | Photos + digest alerts + secondary scraper attempts | NEXT |
| Phase 6 | Nginx Proxy Manager + public domain | PENDING |

## Phase 1–4 Completed Summary

- Redfin GIS API scraper: 37 OR/WA regions
- Realtor.com scraper: HomeHarvest library, 12 OR/WA cities
- Cross-source deduplication: 495 duplicates hidden, 1,431 canonical listings
- Map bounds search: "Search this area" → Browse with lat/lng bounds filter
- Browse: grid cards, sort, pagination, saved searches, CSV export, favorites
- Detail: price history chart (Recharts), specifications table
- Settings: source status, data quality indicator, saved searches manager
- Docker: `compose build && compose up -d --force-recreate` workflow

## Phase 5: Photos + Alerts + Secondary Sources

**Goal**: Extract listing photos, add new-listing digest alerts, attempt Playwright for blocked sites.

**Deliverables**:
- Map `primary_photo` from HomeHarvest results to `photo_url` in DB
- Map Redfin image URLs to `photo_url`
- Telegram digest: "N new listings matching your saved search"
- Attempt Playwright for Zillow / LandWatch (likely blocked; document results)

## Phase 6: Public Access

**Goal**: Serve via `homes.westteck.home` through Nginx Proxy Manager.

**Requires**: Manual port addition in NPM; Pi-hole already points domain to 111.

---
*Last updated: 2026-08-07*
