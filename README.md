# Home Finder

Multi-source real estate listing aggregator with React frontend and PHP API.

## Stack

- **Scraper**: Python stdlib `urllib` + Playwright (Redfin GIS API + headless for secondary sources)
- **Database**: SQLite
- **API**: PHP (vanilla, PDO)
- **Frontend**: React + Vite + Leaflet + Recharts
- **Deployment**: Docker on local server (111)

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/stats.php` | Active count, min/max prices |
| `GET /api/filters.php` | Distinct cities & states |
| `GET /api/listings.php?min_price=...` | Paginated filtered listings |
| `GET /api/listing.php?id=...` | Single listing detail |
| `GET /api/history.php?id=...` | Price history for chart |

## Deploy

```bash
rsync -az --delete ./ raggsy@10.10.10.111:/tmp/home-finder-docker/
ssh raggsy@10.10.10.111 "cd /tmp/home-finder-docker && docker build -t home-finder:latest . && docker stop home-finder && docker rm home-finder && docker run -d --name home-finder -p 3013:80 -v /local/docker/home-finder/data:/app/data -v /local/docker/home-finder/logs:/var/log --restart unless-stopped home-finder:latest"
```
