# Usage (from the repo root):
#   .\backend\run-tests.ps1
#   .\backend\run-tests.ps1 --filter=AlertServiceTest
#   .\backend\run-tests.ps1 --log-junit=storage/logs/junit.xml --coverage-cobertura=storage/logs/cobertura.xml

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$TestArgs
)

$envArgs = @(
    "-e", "APP_ENV=testing",
    "-e", "DB_DATABASE=futurekawa_test",
    "-e", "CACHE_STORE=array",
    "-e", "SESSION_DRIVER=array",
    "-e", "QUEUE_CONNECTION=sync",
    "-e", "MAIL_MAILER=array",
    "-e", "WEBHOOK_TOKEN=test-webhook-token"
)

docker compose exec -T @envArgs laravel php artisan config:clear

docker compose exec -T @envArgs laravel vendor/bin/phpunit @TestArgs
$testExitCode = $LASTEXITCODE

docker compose exec -T laravel php artisan config:cache | Out-Null

exit $testExitCode
