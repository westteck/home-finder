# Roadmap

## Phase 1 — Foundation ✅
- [x] SQLite schema (`listings`, `listing_history`)
- [x] Redfin GIS scraper (37 OR/WA regions)
- [x] PHP API endpoints (`listings`, `listing`, `history`, `stats`, `filters`)
- [x] React SPA (Browse, Detail, Reports, Settings)
- [x] Docker container + cron

## Phase 2 — Multi-Source ✅
- [x] HomeHarvest scraper (Realtor.com)
- [x] Auto-deduplication (`address+city+state`, cheapest canonical)
- [x] `is_canonical` / `all=1` toggle
- [x] `lot_size_sqft` conversion

## Phase 3 — Map + Location ✅
- [x] Add `latitude`/`longitude` columns
- [x] Backfill coords from `raw_json`
- [x] Map bounds filter (`lat_min`, `lat_max`, `lng_min`, `lng_max`)
- [x] "Search this area" (in-page results below map)
- [x] Nginx Proxy Manager integration (`homes.westteck.home`)

## Phase 4 — UX Polish ✅
- [x] Save Current Search button + dropdown
- [x] Migrate legacy `search_criteria` → `saved_searches`
- [x] 7 preset searches (Best Value, Budget, Family Starter, Acreage, Big Land, Fixer, Price Drop)
- [x] Show `$/sqft` and `$/acre` on listing cards
- [x] Fix `history.php` column mismatch (`checked_at` → `changed_at`)

## Phase 5 — Alerts & Automation 🔄
- [ ] Price-change detection in scraper (populate `listing_history`)
- [ ] Telegram digest bot (new matching listings → message)
- [ ] Scheduled saved-search digest emails / messages

## Phase 6 — Scale
- [ ] Add more OR/WA cities to HomeHarvest
- [ ] Retry residential IP rotation (Proton VPN) for Zillow
- [ ] Photo URL extraction and Gallery view option
- [ ] Admin dashboard with scrape logs
- [ ] Automated deploy script (rsync from git on cron)

---
*Updated: 2026-08-09*
