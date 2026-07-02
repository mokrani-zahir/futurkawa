<?php

namespace Tests\Unit\Services;

use App\Models\Batch;
use App\Models\User;
use App\Models\Zone;
use App\Services\AlertService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AlertServiceTest extends TestCase
{
    use RefreshDatabase;

    private AlertService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new AlertService();
    }

    public function test_creates_webhook_alert_for_known_zone(): void
    {
        $zone = Zone::factory()->create();

        $alert = $this->service->createWebhookAlert($zone, [
            'zone'  => $zone->name,
            'lot'   => 'dht22-t1',
            'value' => 23.6,
        ]);

        $this->assertNotNull($alert);
        $this->assertSame($zone->id, $alert->zone_id);
        $this->assertSame('dht22-t1', $alert->sensor_name);
        $this->assertSame('webhook', $alert->type);
        // is_resolved relies on the DB column default, not an explicit value on
        // create(), so the in-memory model only reflects it once refreshed.
        $this->assertFalse((bool) $alert->fresh()->is_resolved);
        $this->assertStringContainsString('dht22-t1', $alert->title);
        $this->assertStringContainsString('23.6', $alert->message);
    }

    public function test_does_not_duplicate_an_unresolved_webhook_alert(): void
    {
        $zone = Zone::factory()->create();
        $payload = ['zone' => $zone->name, 'lot' => 'dht22-t1', 'value' => 23.6];

        $first  = $this->service->createWebhookAlert($zone, $payload);
        $second = $this->service->createWebhookAlert($zone, $payload);

        $this->assertNotNull($first);
        $this->assertNull($second);
        $this->assertSame(1, $zone->alerts()->count());
    }

    public function test_creates_a_new_webhook_alert_once_previous_one_is_resolved(): void
    {
        $zone = Zone::factory()->create();
        $payload = ['zone' => $zone->name, 'lot' => 'dht22-t1', 'value' => 23.6];

        $first = $this->service->createWebhookAlert($zone, $payload);
        $first->update(['is_resolved' => true]);

        $second = $this->service->createWebhookAlert($zone, $payload);

        $this->assertNotNull($second);
        $this->assertSame(2, $zone->alerts()->count());
    }

    public function test_creates_unknown_zone_alert_when_zone_not_found(): void
    {
        $alert = $this->service->createUnknownZoneAlert([
            'zone' => 'atlantis',
            'lot'  => 'dht22-t1',
        ]);

        $this->assertNotNull($alert);
        $this->assertNull($alert->zone_id);
        $this->assertStringContainsString('atlantis', $alert->title);
    }

    public function test_does_not_duplicate_an_unresolved_unknown_zone_alert(): void
    {
        $payload = ['zone' => 'atlantis', 'lot' => 'dht22-t1'];

        $first  = $this->service->createUnknownZoneAlert($payload);
        $second = $this->service->createUnknownZoneAlert($payload);

        $this->assertNotNull($first);
        $this->assertNull($second);
    }

    public function test_creates_storage_expiry_alert(): void
    {
        $batch = Batch::factory()->expired()->create();

        $alert = $this->service->createStorageExpiryAlert($batch);

        $this->assertNotNull($alert);
        $this->assertSame('storage_expiry', $alert->type);
        $this->assertSame($batch->id, $alert->batch_id);
        $this->assertSame($batch->zone_id, $alert->zone_id);
        $this->assertStringContainsString($batch->name, $alert->title);
    }

    public function test_does_not_duplicate_an_unresolved_storage_expiry_alert(): void
    {
        $batch = Batch::factory()->expired()->create();

        $first  = $this->service->createStorageExpiryAlert($batch);
        $second = $this->service->createStorageExpiryAlert($batch);

        $this->assertNotNull($first);
        $this->assertNull($second);
    }

    public function test_resolve_marks_alert_as_resolved_by_user(): void
    {
        $zone  = Zone::factory()->create();
        $alert = $zone->alerts()->create([
            'type'    => 'webhook',
            'title'   => 'Test',
            'message' => 'Test message',
        ]);
        $user = User::factory()->admin()->create();

        $resolved = $this->service->resolve($alert, $user);

        $this->assertTrue($resolved->is_resolved);
        $this->assertSame($user->id, $resolved->resolved_by);
        $this->assertNotNull($resolved->resolved_at);
    }
}
