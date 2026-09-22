# Home Finder Docker

Self-hosted housing search app on 10.10.10.111:3013 with safe-area (WA/OR) filtering, saved searches, and rentals page.

## Stack
- Frontend: Vite/React SPA
- Backend: PHP + SQLite
- Container: Docker on 111, volume `/local/docker/home-finder`
- Reverse proxy: NPM at `money.westteck.home` on 8899 (westteck-money)

## Quick Links
- App: http://10.10.10.111:3013
- API: /api/listings.php, /api/preset_search.php, /api/saved_searches.php
- DB: /local/docker/home-finder/data/homefinder.db

## Session History

### 2026-09-06
- Fixed safe_area filter: replaced hardcoded county whitelist with `state IN ('WA','OR')`
- Verified safe searches return results: 274 WA, 1027 OR, 1030 best_value
- Added Edit/Delete buttons to saved searches dropdown
- Added active-search indicator showing which saved search/preset is applied
- Fixed preset_search.php to apply all filters (state, price, beds, etc.)
- Fixed ENTRYPOINT to background scraper/dedup before Apache starts

## Next Steps
- Add proper county selector for safety filtering if needed
- Add more live cities like Coos Bay
- Consider scraper improvements for rental vs sale tagging
