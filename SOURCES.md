# Sources

## Active

| Site | Method | Status | Notes |
|------|--------|--------|-------|
| Redfin | GIS API (internal) | Working | 37 OR/WA regions; JSON with `lstrip("{}").lstrip("&&")` prefix strip |

## Attempted / Blocked

All return 403/429/Cloudflare with stdlib `urllib`. Playwright (headless Chromium) may bypass; not yet tested.

| Site | Blocker | Notes |
|------|---------|-------|
| Zillow | Cloudflare + no public API | HTML is JS-rendered |
| LandWatch | 403 / bot challenge | Requires JS execution |
| Realtor.com | 403 / Cloudflare | No public JSON endpoint found |
| LoopNet | 403 | Commercial focus |
| PropertyShark | 403 | Paywalled |
| lands.com | Cloudflare | |
| Craigslist | RSS blocked, HTML JS-rendered | Non-functional stub in repo |
| landmoto.com | Dead — expired SSL + unreachable | |
| mls.com / NWMLS / BrightMLS | Gated / login required | No public API |

## Playwright Candidates

Sites to attempt with Playwright headless once prioritized:

1. **Zillow** — `zillow.com/homes/` search results
2. **LandWatch** — `landwatch.com` (land / rural focus, matches lot-size criteria)
3. **Realtor.com** — `realtor.com/realestateandhomes-search/` results
4. **LoopNet** — if commercial/multi-family desired

## LLM Usage

No LLM is used at runtime in the app. This project was built with assistance from Hermes Agent (local CLI agent); no external AI services are called during scraping, filtering, or serving.
