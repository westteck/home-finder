#!/bin/sh
# Start php-fpm in background
php-fpm &

# Run scraper once on startup
python3 /app/scraper/main.py >> /app/data/scraper.log 2>&1

# Start cron
crond -f
