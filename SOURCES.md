# Sources

## Active

| Site | Method | Status | Notes |
|------|--------|--------|-------|
| Redfin | GIS API (internal) | Active | 37 OR/WA regions; JSON with `lstrip("{}").lstrip("&&")` prefix strip |
| Realtor.com | HomeHarvest (Python library) | Active | 12 OR/WA cities via HomeHarvest `scrape_property()`; returns pandas DataFrame; filters OR/WA at parse time |

## Deduplication

After every scrape, `scraper/dedup.py` runs:
- Groups listings by `address + city + state`
- Marks **lowest price** as `is_canonical = 1`
- Marks all others in the group `is_canonical = 0`
- API returns canonical only by default (`all=1` to show duplicates)
- Browse page has a **"Show duplicates"** checkbox

**Current counts:**
- Total listings: ~1,926
- Canonical (unique addresses): ~1,431
- Hidden duplicates: ~495

## Attempted / Blocked

| Site | Blocker | Notes |
|------|---------|-------|
| Zillow | Cloudflare + no public API | HTML is JS-rendered; Playwright not attempted |
| LandWatch | 403 / bot challenge | Requires JS execution |
| LoopNet | 403 | Commercial focus |
| PropertyShark | 403 | Paywalled |
| MLS / NWMLS / BrightMLS | Gated / login required | No public API |

## Playwright Candidates

Sites to attempt with Playwright headless once prioritized:

1. **Zillow** — `zillow.com/homes/` search results
2. **LandWatch** — `landwatch.com` (land / rural focus, matches lot-size criteria)

## LLM / AI Usage

No LLM is used at runtime in the app. This project was built with assistance from Hermes Agent (local CLI agent); no external AI services are called during scraping, filtering, or serving.
