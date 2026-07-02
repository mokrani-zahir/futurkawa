#!/bin/sh
set -e

# Runs the backend test suite inside the running `laravel` container.
#
# Why the -e overrides: the `laravel` service is started with `env_file: .env`
# (see docker-compose.yml), which injects the *development* database and
# service credentials as real process environment variables. Laravel's Dotenv
# loader is immutable and never overrides an already-set env var, and PHPUnit's
# own <env> overrides in phpunit.xml only touch putenv()/$_ENV — not $_SERVER,
# which Laravel also consults — so neither can redirect the connection on
# their own. Passing the overrides straight to `docker compose exec -e` sets
# them as real process env vars for this one-off command, before PHP even
# starts, which both layers do respect.
#
# Usage: ./backend/run-tests.sh [phpunit args, e.g. --filter=AlertServiceTest]

ENV_OVERRIDES="-e APP_ENV=testing \
  -e DB_DATABASE=futurekawa_test \
  -e CACHE_STORE=array \
  -e SESSION_DRIVER=array \
  -e QUEUE_CONNECTION=sync \
  -e MAIL_MAILER=array \
  -e WEBHOOK_TOKEN=test-webhook-token"

# The running php-fpm process serves production-tuned config from a cached
# file (config:cache, done at container boot); clear it so this exec picks up
# the overrides above, then restore the cache for the live app afterwards.
docker compose exec $ENV_OVERRIDES laravel php artisan config:clear

status=0
docker compose exec $ENV_OVERRIDES laravel php artisan test "$@" || status=$?

docker compose exec laravel php artisan config:cache >/dev/null

exit $status
