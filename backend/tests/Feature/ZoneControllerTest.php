<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ZoneControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_zones(): void
    {
        $this->getJson('/api/zones')->assertStatus(401);
    }

    public function test_any_authenticated_user_can_list_zones_with_counts(): void
    {
        $user = User::factory()->viewer()->create();
        $zone = Zone::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/zones');

        $response->assertOk()->assertJsonFragment(['id' => $zone->id]);
        $this->assertArrayHasKey('batches_count', $response->json('data.0'));
        $this->assertArrayNotHasKey('api_password', $response->json('data.0'));
    }

    public function test_admin_can_create_a_zone(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/zones', [
            'name'         => 'Usine A',
            'api_url'      => 'https://api.example.com',
            'api_username' => 'zoneuser',
            'api_password' => 'zonepass',
        ]);

        $response->assertCreated()->assertJsonPath('name', 'Usine A');
        $this->assertDatabaseHas('zones', ['name' => 'Usine A']);
    }

    public function test_viewer_cannot_create_a_zone(): void
    {
        $viewer = User::factory()->viewer()->create();

        $response = $this->actingAs($viewer, 'sanctum')->postJson('/api/zones', [
            'name'         => 'Usine A',
            'api_url'      => 'https://api.example.com',
            'api_username' => 'zoneuser',
            'api_password' => 'zonepass',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('zones', ['name' => 'Usine A']);
    }

    public function test_creating_a_zone_validates_required_fields(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/zones', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'api_url', 'api_username', 'api_password']);
    }

    public function test_can_show_a_single_zone(): void
    {
        $user = User::factory()->create();
        $zone = Zone::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/zones/{$zone->id}");

        // Unlike store()/destroy(), show() returns the resource directly, which
        // Laravel auto-wraps in a "data" envelope.
        $response->assertOk()->assertJsonPath('data.id', $zone->id);
    }

    public function test_admin_can_update_a_zone(): void
    {
        $admin = User::factory()->admin()->create();
        $zone  = Zone::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/zones/{$zone->id}", ['name' => 'Nouveau nom']);

        $response->assertOk()->assertJsonPath('data.name', 'Nouveau nom');
    }

    public function test_viewer_cannot_update_a_zone(): void
    {
        $viewer = User::factory()->viewer()->create();
        $zone   = Zone::factory()->create();

        $response = $this->actingAs($viewer, 'sanctum')
            ->putJson("/api/zones/{$zone->id}", ['name' => 'Nouveau nom']);

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_a_zone(): void
    {
        $admin = User::factory()->admin()->create();
        $zone  = Zone::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/zones/{$zone->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('zones', ['id' => $zone->id]);
    }

    public function test_viewer_cannot_delete_a_zone(): void
    {
        $viewer = User::factory()->viewer()->create();
        $zone   = Zone::factory()->create();

        $response = $this->actingAs($viewer, 'sanctum')->deleteJson("/api/zones/{$zone->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('zones', ['id' => $zone->id]);
    }
}
