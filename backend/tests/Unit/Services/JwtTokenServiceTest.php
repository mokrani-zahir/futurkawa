<?php

namespace Tests\Unit\Services;

use App\Models\Zone;
use App\Models\ZoneToken;
use App\Services\JwtTokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class JwtTokenServiceTest extends TestCase
{
    use RefreshDatabase;

    private JwtTokenService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new JwtTokenService();
    }

    public function test_fetches_and_caches_a_token_when_none_exists(): void
    {
        $zone = Zone::factory()->create(['api_url' => 'https://api.example.com']);

        Http::fake([
            'api.example.com/*' => Http::response(['token' => 'jwt-token', 'expiresIn' => 3600]),
        ]);

        $result = $this->service->getTokenForZone($zone);

        $this->assertSame('jwt-token', $result['token']);
        $this->assertSame(1, ZoneToken::where('zone_id', $zone->id)->count());

        Http::assertSent(function ($request) use ($zone) {
            return str_contains($request->url(), 'api.example.com/api/v1/jwt')
                && $request['username'] === $zone->api_username
                && $request['expiresIn'] === 3600;
        });
    }

    public function test_returns_cached_token_without_calling_the_api_when_still_valid(): void
    {
        $zone = Zone::factory()->create();
        ZoneToken::factory()->for($zone)->create([
            'token'      => 'cached-token',
            'expires_at' => now()->addHour(),
        ]);

        Http::fake();

        $result = $this->service->getTokenForZone($zone);

        $this->assertSame('cached-token', $result['token']);
        Http::assertNothingSent();
    }

    public function test_refreshes_the_token_when_the_cached_one_is_about_to_expire(): void
    {
        $zone = Zone::factory()->create();
        ZoneToken::factory()->for($zone)->create([
            'token'      => 'stale-token',
            'expires_at' => now()->addMinutes(2),
        ]);

        Http::fake([
            '*' => Http::response(['token' => 'fresh-token', 'expiresIn' => 3600]),
        ]);

        $result = $this->service->getTokenForZone($zone);

        $this->assertSame('fresh-token', $result['token']);
        $this->assertSame(1, ZoneToken::where('zone_id', $zone->id)->count());
    }

    public function test_throws_when_the_external_api_call_fails(): void
    {
        $zone = Zone::factory()->create();

        Http::fake([
            '*' => Http::response(['message' => 'unauthorized'], 401),
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches("/Failed to obtain JWT for zone '{$zone->name}'/");

        $this->service->getTokenForZone($zone);
    }
}
