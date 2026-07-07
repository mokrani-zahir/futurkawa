#!/bin/sh
set -e

# Usage: ./backend/run-tests.sh [phpunit args, e.g. --filter=AlertServiceTest]

ENV_OVERRIDES="-e APP_ENV=testing \
  -e DB_DATABASE=futurekawa_test \
  -e CACHE_STORE=array \
  -e SESSION_DRIVER=array \
  -e QUEUE_CONNECTION=sync \
  -e MAIL_MAILER=array \
  -e WEBHOOK_TOKEN=test-webhook-token"

docker compose exec -T $ENV_OVERRIDES laravel php artisan config:clear

status=0
docker compose exec -T $ENV_OVERRIDES laravel php artisan test "$@" || status=$?

docker compose exec -T laravel php artisan config:cache >/dev/null

exit $status
