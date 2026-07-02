<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SensorControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_list_sensors(): void
    {
        $zone = Zone::factory()->create();

        $this->getJson("/api/zones/{$zone->id}/sensors")->assertStatus(401);
    }

    public function test_lists_sensors_from_the_external_api(): void
    {
        $user = User::factory()->create();
        $zone = Zone::factory()->create(['api_url' => 'https://api.example.com']);

        Http::fake([
            '*/api/v1/jwt*' => Http::response(['token' => 'jwt-token', 'expiresIn' => 3600]),
            '*/api/v1/lot*' => Http::response([
                ['name' => 'dht22-t1'],
                ['name' => 'bmp280-p1'],
            ]),
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/zones/{$zone->id}/sensors");

        $response->assertOk()->assertJsonCount(2, 'data');
    }
}
