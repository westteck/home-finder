# Project Log

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | SQLite over MySQL/Postgres | Zero-config, single file, host bind mount, survives container rebuilds |
| 2 | HomeHarvest over Zillow scraper | Zillow blocked by Cloudflare; HomeHarvest purpose-built for Realtor.com |
| 3 | `--system-site-packages` venv | Avoids numpy compile crash on ARM Mac Mini + Rosetta (inherits apt `python3-pandas`) |
| 4 | In-page map results instead of router navigate | `BrowserRouter` + Apache rewrite silently drops query params; state-based avoids bug |
| 5 | Dedup by exact address+city+state | Cheapest wins canonical; simple, deterministic, covers most cross-source overlap |
| 6 | PHP PDO API (vanilla) | No frameworks, fast to patch, runs in container with zero extra deps |
| 7 | React SPA with Search button (not live filter) | Avoids spamming API on every keystroke; user clicks to search |
| 8 | Text-only cards (no images) | User preference; avoids layout shift, loads fast, works without photo URLs |
| 9 | Preset searches on Browse page | One-click value filters ($/sqft, budget, acreage) without typing ranges |
| 10 | Nginx Proxy Manager for external access | `homes.westteck.home` → container via shared `proxy` network; SSL managed by NPM |

## Mistakes / Fixes

| Date | Issue | Fix |
|------|-------|-----|
| 2026-08-07 | `latitude`/`longitude` columns missing from schema | Added columns + backfilled 1,278 from `raw_json` |
| 2026-08-07 | Map "Search this area" navigated to Browse but params dropped | Rewrote to in-page state; results render below map |
| 2026-08-07 | `saved_searches` table empty; UI showed dropdown but nothing | Migrated legacy `search_criteria` row → `saved_searches`; added Save button |
| 2026-08-08 | `nginx_proxy_manager` couldn't reach container | Joined `home-finder` to external `proxy` network; updated NPM DB row |
| 2026-08-08 | `history.php` referenced nonexistent `checked_at` column | Renamed to `changed_at` (matches actual schema) |
| 2026-08-08 | All preset buttons returned identical counts | PHP `switch` was falling through; fixed with `break` statements |

## Pending

- Price-change detection in scrapers → more `listing_history` records
- Telegram digest alerts
- Automated deploy script (GitHub Actions or cron)

---
*Updated: 2026-08-09*
