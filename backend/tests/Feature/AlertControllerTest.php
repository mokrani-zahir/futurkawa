<?php

namespace Tests\Feature;

use App\Models\Alert;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AlertControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_alerts(): void
    {
        $this->getJson('/api/alerts')->assertStatus(401);
    }

    public function test_lists_alerts_ordered_by_most_recent_first(): void
    {
        $user  = User::factory()->create();
        $older = Alert::factory()->for(Zone::factory())->create(['created_at' => now()->subDay()]);
        $newer = Alert::factory()->for(Zone::factory())->create(['created_at' => now()]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/alerts');

        $response->assertOk();
        $this->assertSame($newer->id, $response->json('data.0.id'));
        $this->assertSame($older->id, $response->json('data.1.id'));
    }

    public function test_can_filter_alerts_by_zone(): void
    {
        $user  = User::factory()->create();
        $zoneA = Zone::factory()->create();
        $alertA = Alert::factory()->for($zoneA)->create();
        Alert::factory()->for(Zone::factory())->create();

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/alerts?zone_id={$zoneA->id}");

        $response->assertOk()->assertJsonCount(1, 'data')->assertJsonFragment(['id' => $alertA->id]);
    }

    public function test_can_filter_alerts_by_type(): void
    {
        $user = User::factory()->create();
        Alert::factory()->for(Zone::factory())->create(['type' => 'webhook']);
        $expiry = Alert::factory()->for(Zone::factory())->create(['type' => 'storage_expiry']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/alerts?type=storage_expiry');

        $response->assertOk()->assertJsonCount(1, 'data')->assertJsonFragment(['id' => $expiry->id]);
    }

    public function test_can_filter_unresolved_only(): void
    {
        $user = User::factory()->create();
        $unresolved = Alert::factory()->for(Zone::factory())->create(['is_resolved' => false]);
        Alert::factory()->for(Zone::factory())->resolved()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/alerts?unresolved_only=1');

        $response->assertOk()->assertJsonCount(1, 'data')->assertJsonFragment(['id' => $unresolved->id]);
    }

    public function test_can_filter_resolved_only(): void
    {
        $user = User::factory()->create();
        Alert::factory()->for(Zone::factory())->create(['is_resolved' => false]);
        $resolved = Alert::factory()->for(Zone::factory())->resolved()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/alerts?resolved_only=1');

        $response->assertOk()->assertJsonCount(1, 'data')->assertJsonFragment(['id' => $resolved->id]);
    }

    public function test_authenticated_user_can_resolve_an_unresolved_alert(): void
    {
        $user  = User::factory()->create();
        $alert = Alert::factory()->for(Zone::factory())->create(['is_resolved' => false]);

        $response = $this->actingAs($user, 'sanctum')->patchJson("/api/alerts/{$alert->id}/resolve");

        $response->assertOk()->assertJsonPath('is_resolved', true);
        $this->assertDatabaseHas('alerts', ['id' => $alert->id, 'is_resolved' => true, 'resolved_by' => $user->id]);
    }

    public function test_resolving_an_already_resolved_alert_returns_a_conflict(): void
    {
        $user  = User::factory()->create();
        $alert = Alert::factory()->for(Zone::factory())->resolved()->create();

        $response = $this->actingAs($user, 'sanctum')->patchJson("/api/alerts/{$alert->id}/resolve");

        $response->assertStatus(422);
    }
}
