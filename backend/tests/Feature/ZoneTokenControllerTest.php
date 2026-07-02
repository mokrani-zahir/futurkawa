<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ZoneTokenControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_request_a_zone_token(): void
    {
        $zone = Zone::factory()->create();

        $this->getJson("/api/zones/{$zone->id}/token")->assertStatus(401);
    }

    public function test_returns_a_jwt_and_websocket_url_for_the_zone(): void
    {
        $user = User::factory()->create();
        $zone = Zone::factory()->create(['api_url' => 'https://api.example.com']);

        Http::fake([
            '*/api/v1/jwt*' => Http::response(['token' => 'jwt-token', 'expiresIn' => 3600]),
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/zones/{$zone->id}/token");

        $response->assertOk()
            ->assertJsonPath('token', 'jwt-token')
            ->assertJsonPath('ws_url', 'https://api.example.com/ws/');
    }

    public function test_returns_a_gateway_error_when_the_external_api_is_unreachable(): void
    {
        $user = User::factory()->create();
        $zone = Zone::factory()->create(['api_url' => 'https://api.example.com']);

        Http::fake([
            '*/api/v1/jwt*' => Http::response(['message' => 'down'], 500),
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/zones/{$zone->id}/token");

        $response->assertStatus(502);
    }
}
