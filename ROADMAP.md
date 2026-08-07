# ROADMAP: Home Finder

## Overview

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Scraper skeleton + SQLite schema + first source | DONE |
| Phase 2 | Multi-region + deduplication + data integrity | DONE |
| Phase 3 | React SPA (browse, sort, filter, map, detail, history chart, export) | DONE |
| Phase 4 | Docker container + cron + Playwright install | DONE |
| Phase 5 | Secondary scrapers + photo URLs + digest alerts | NEXT |
| Phase 6 | Nginx Proxy Manager + public domain | PENDING |

## Phase 5: Secondary Sources

**Goal**: Unlock Zillow, LandWatch, Realtor.com via Playwright headless.

**Blockers**: All return 403/Cloudflare with stdlib; Playwright may bypass JS challenges.

**Deliverables**:
- `scraper/playwright_zillow.py` (or similar)
- Photo URL extraction for Redfin scraper
- Digest alert backend (email or Telegram)

## Phase 6: Public Access

**Goal**: Serve via `homes.westteck.home` through Nginx Proxy Manager.

**Requires**: Manual port addition in NPM; Pi-hole already points domain to 111.

---
*Last updated: 2026-08-07*
