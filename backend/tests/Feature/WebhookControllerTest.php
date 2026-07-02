<?php

namespace Tests\Feature;

use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebhookControllerTest extends TestCase
{
    use RefreshDatabase;

    private array $validPayload;

    protected function setUp(): void
    {
        parent::setUp();

        $this->validPayload = [
            'zone'      => 'brazil',
            'lot'       => 'dht22-t1',
            'value'     => 23.6,
            'timestamp' => 1782894384,
        ];
    }

    public function test_rejects_requests_without_a_token(): void
    {
        $response = $this->postJson('/api/webhook/alerts', $this->validPayload);

        $response->assertStatus(401);
    }

    public function test_rejects_requests_with_an_invalid_token(): void
    {
        $response = $this->withHeader('Authorization', 'wrong-token')
            ->postJson('/api/webhook/alerts', $this->validPayload);

        $response->assertStatus(401);
    }

    public function test_accepts_a_valid_token_and_creates_an_alert_for_a_known_zone(): void
    {
        $zone = Zone::factory()->create(['name' => 'brazil']);

        $response = $this->withHeader('Authorization', config('futurekawa.webhook_token'))
            ->postJson('/api/webhook/alerts', $this->validPayload);

        $response->assertStatus(202);
        $this->assertDatabaseHas('alerts', [
            'zone_id'     => $zone->id,
            'sensor_name' => 'dht22-t1',
            'type'        => 'webhook',
        ]);
    }

    public function test_creates_an_unknown_zone_alert_when_the_zone_name_does_not_match(): void
    {
        $response = $this->withHeader('Authorization', config('futurekawa.webhook_token'))
            ->postJson('/api/webhook/alerts', $this->validPayload);

        $response->assertStatus(202);
        $this->assertDatabaseHas('alerts', [
            'zone_id'     => null,
            'sensor_name' => 'dht22-t1',
        ]);
    }

    public function test_ignores_a_duplicate_alert_for_an_already_active_sensor(): void
    {
        Zone::factory()->create(['name' => 'brazil']);
        $header = ['Authorization' => config('futurekawa.webhook_token')];

        $this->withHeaders($header)->postJson('/api/webhook/alerts', $this->validPayload);
        $response = $this->withHeaders($header)->postJson('/api/webhook/alerts', $this->validPayload);

        $response->assertStatus(202)->assertJsonFragment(['message' => 'Alerte déjà active pour ce capteur, ignorée.']);
        $this->assertDatabaseCount('alerts', 1);
    }

    public function test_requires_a_zone_field(): void
    {
        $payload = $this->validPayload;
        unset($payload['zone']);

        $response = $this->withHeader('Authorization', config('futurekawa.webhook_token'))
            ->postJson('/api/webhook/alerts', $payload);

        $response->assertStatus(422)->assertJsonValidationErrors('zone');
    }
}
