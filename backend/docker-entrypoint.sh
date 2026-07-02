#!/bin/sh
set -e

# Copy .env from example if it does not exist
if [ ! -f /var/www/html/.env ]; then
    cp /var/www/html/.env.example /var/www/html/.env
fi

# Sync APP_KEY: prefer the key injected by Docker (env_file) so it stays
# stable across container recreations and the encrypted zone passwords remain valid.
if echo "$APP_KEY" | grep -q "^base64:"; then
    # Key provided via Docker environment — write it into the container .env
    sed -i "s|^APP_KEY=.*|APP_KEY=$APP_KEY|" /var/www/html/.env
elif ! grep -q "^APP_KEY=base64:" /var/www/html/.env 2>/dev/null; then
    # No key anywhere — generate one (first boot only)
    php artisan key:generate --force --no-interaction
fi

# Only the main PHP-FPM process handles migrations and cache warmup.
# Queue workers and the scheduler skip this block to avoid re-running
# migrations against already-created tables.
if [ "$1" = "php-fpm" ]; then
    php artisan migrate --force --no-interaction
    php artisan db:seed --class=AdminUserSeeder --force --no-interaction
    php artisan config:cache --no-interaction
    php artisan route:cache  --no-interaction
fi

exec "$@"
