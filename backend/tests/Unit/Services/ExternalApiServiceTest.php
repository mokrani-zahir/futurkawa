<?php

namespace Tests\Unit\Services;

use App\Models\Zone;
use App\Models\ZoneToken;
use App\Services\ExternalApiService;
use App\Services\JwtTokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class ExternalApiServiceTest extends TestCase
{
    use RefreshDatabase;

    private ExternalApiService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new ExternalApiService(new JwtTokenService());
    }

    public function test_get_sensors_returns_the_decoded_sensor_list(): void
    {
        $zone = Zone::factory()->create(['api_url' => 'https://api.example.com']);

        Http::fake([
            '*/api/v1/jwt*' => Http::response(['token' => 'jwt-token', 'expiresIn' => 3600]),
            '*/api/v1/lot*' => Http::response([
                ['name' => 'dht22-t1'],
                ['name' => 'dht22-h1'],
            ]),
        ]);

        $sensors = $this->service->getSensors($zone);

        $this->assertCount(2, $sensors);
        $this->assertSame('dht22-t1', $sensors[0]['name']);

        Http::assertSent(fn ($request) => str_contains($request->url(), '/api/v1/lot')
            && $request->hasHeader('Authorization', 'Bearer jwt-token'));
    }

    public function test_get_sensor_measures_targets_the_sensor_specific_endpoint(): void
    {
        $zone = Zone::factory()->create(['api_url' => 'https://api.example.com']);

        Http::fake([
            '*/api/v1/jwt*'             => Http::response(['token' => 'jwt-token', 'expiresIn' => 3600]),
            '*/api/v1/lot/dht22-t1*'   => Http::response(['values' => [23.6, 23.7]]),
        ]);

        $measures = $this->service->getSensorMeasures($zone, 'dht22-t1', ['from' => '2026-01-01']);

        $this->assertSame(['values' => [23.6, 23.7]], $measures);

        Http::assertSent(fn ($request) => str_contains($request->url(), '/api/v1/lot/dht22-t1')
            && $request['from'] === '2026-01-01');
    }

    public function test_retries_once_with_a_fresh_token_after_a_401(): void
    {
        $zone = Zone::factory()->create(['api_url' => 'https://api.example.com']);

        Http::fake([
            '*/api/v1/jwt*' => Http::response(['token' => 'jwt-token', 'expiresIn' => 3600]),
            '*/api/v1/lot*' => Http::sequence()
                ->push(['message' => 'unauthorized'], 401)
                ->push([['name' => 'dht22-t1']], 200),
        ]);

        $sensors = $this->service->getSensors($zone);

        $this->assertCount(1, $sensors);
        Http::assertSentCount(4); // jwt, lot(401), jwt(refresh), lot(200)
        $this->assertSame(1, ZoneToken::where('zone_id', $zone->id)->count()); // stale token replaced by the refreshed one
    }

    public function test_throws_on_a_non_401_error(): void
    {
        $zone = Zone::factory()->create(['api_url' => 'https://api.example.com']);

        Http::fake([
            '*/api/v1/jwt*' => Http::response(['token' => 'jwt-token', 'expiresIn' => 3600]),
            '*/api/v1/lot*' => Http::response(['message' => 'server error'], 500),
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches("/External API call failed for zone '{$zone->name}'/");

        $this->service->getSensors($zone);
    }
}
