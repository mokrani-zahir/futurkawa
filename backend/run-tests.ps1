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
# Usage (from the repo root):
#   .\backend\run-tests.ps1
#   .\backend\run-tests.ps1 --filter=AlertServiceTest

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$TestArgs
)

# Native commands below (docker compose exec) write routine progress/warning
# output to stderr; under $ErrorActionPreference = 'Stop' (Jenkins' default
# for the powershell step) PowerShell 5.1 turns that into a terminating
# NativeCommandError, aborting the script before $testExitCode is ever read —
# even though the actual exit code was 0. Force 'Continue' so only the real
# $LASTEXITCODE checks below decide pass/fail.
$ErrorActionPreference = 'Continue'

$envArgs = @(
    "-e", "APP_ENV=testing",
    "-e", "DB_DATABASE=futurekawa_test",
    "-e", "CACHE_STORE=array",
    "-e", "SESSION_DRIVER=array",
    "-e", "QUEUE_CONNECTION=sync",
    "-e", "MAIL_MAILER=array",
    "-e", "WEBHOOK_TOKEN=test-webhook-token"
)

# The running php-fpm process serves production-tuned config from a cached
# file (config:cache, done at container boot); clear it so this exec picks up
# the overrides above, then restore the cache for the live app afterwards.
# -T disables pseudo-TTY allocation — required in non-interactive shells
# (CI runners) which don't have one to attach.
docker compose exec -T @envArgs laravel php artisan config:clear

docker compose exec -T @envArgs laravel php artisan test @TestArgs
$testExitCode = $LASTEXITCODE

docker compose exec -T laravel php artisan config:cache | Out-Null

exit $testExitCode
