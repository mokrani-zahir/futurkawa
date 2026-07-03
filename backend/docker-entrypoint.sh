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

# docker-compose's env_file always sets APP_KEY in the process environment,
# even to an empty string when the root .env leaves it blank. Laravel's
# dotenv loader is immutable — it refuses to let the .env file override a
# variable that's already set, blank or not — so without this, the key we
# just wrote/synced above into .env stays invisible to the app. Re-export it
# from the container .env so php-fpm (execed below) actually sees it.
APP_KEY=$(grep -m1 '^APP_KEY=' /var/www/html/.env | cut -d= -f2-)
export APP_KEY

# Only the main PHP-FPM process handles migrations and cache warmup.
# Queue workers and the scheduler skip this block to avoid re-running
# migrations against already-created tables.
if [ "$1" = "php-fpm" ]; then
    # Create the dedicated test database (used by `php artisan test`) if it
    # doesn't exist yet. Migrations for it are run on-demand by RefreshDatabase
    # in the test suite, not here.
    php -r '
        try {
            $pdo = new PDO(
                "pgsql:host=" . getenv("DB_HOST") . ";port=" . getenv("DB_PORT") . ";dbname=" . getenv("DB_DATABASE"),
                getenv("DB_USERNAME"),
                getenv("DB_PASSWORD")
            );
            $testDb = getenv("DB_DATABASE") . "_test";
            $stmt = $pdo->prepare("SELECT 1 FROM pg_database WHERE datname = ?");
            $stmt->execute([$testDb]);
            if (! $stmt->fetch()) {
                $pdo->exec("CREATE DATABASE \"$testDb\"");
            }
        } catch (Throwable $e) {
            fwrite(STDERR, "Skipping test database creation: {$e->getMessage()}\n");
        }
    ' || true

    php artisan migrate --force --no-interaction
    php artisan db:seed --class=AdminUserSeeder --force --no-interaction
    php artisan config:cache --no-interaction
    php artisan route:cache  --no-interaction
fi

exec "$@"
