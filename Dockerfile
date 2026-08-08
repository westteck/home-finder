FROM php:8.2-apache

# System deps: Python3, Playwright, cron, SQLite, Node + pandas via apt (pre-built, avoids compilation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv python3-requests python3-bs4 python3-pandas python3-numpy cron sqlite3 \
    curl gnupg ca-certificates libnss3 libatk-bridge2.0-0 libxss1 libgtk-3-0 \
    libasound2 libdbus-glib-1-2 libxt6 \
    && rm -rf /var/lib/apt/lists/*

# Node for React build
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Python deps in a venv (inherits apt pandas/numpy to avoid compilation)
RUN python3 -m venv --system-site-packages /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir playwright beautifulsoup4 homeharvest \
    && /opt/venv/bin/playwright install chromium

ENV PATH="/opt/venv/bin:$PATH"

# Enable Apache rewrite + set document root
RUN a2enmod rewrite \
    && sed -ri 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|g' /etc/apache2/sites-available/000-default.conf

# Create directories
RUN mkdir -p /app/data /app/scraper /var/www/html/public /var/www/html/api /var/log

# Copy scraper + web code
COPY scraper/ /app/scraper/
COPY www/public/ /var/www/html/public/

# Permissions
RUN chown -R www-data:www-data /app /var/www/html

# Cron: hourly scraper
RUN printf "SHELL=/bin/sh\nPATH=/opt/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n0 * * * * root cd /app/scraper && python3 /app/scraper/main.py >> /app/data/scraper.log 2>&1\n" > /etc/cron.d/home-finder && chmod 0644 /etc/cron.d/home-finder

ENV TZ=America/Los_Angeles
EXPOSE 80

ENTRYPOINT ["sh", "-c", "mkdir -p /app/data /var/log /var/log/apache2 && (python3 /app/scraper/main.py >> /app/data/scraper.log 2>&1 &) && cron && apachectl -D FOREGROUND"]
