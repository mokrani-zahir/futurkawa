<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BatchControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_batches(): void
    {
        $this->getJson('/api/batches')->assertStatus(401);
    }

    public function test_lists_batches_with_their_sensors(): void
    {
        $user  = User::factory()->create();
        $batch = Batch::factory()->create();
        $batch->sensors()->create(['sensor_name' => 'dht22-t1']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/batches');

        $response->assertOk()->assertJsonFragment(['sensors' => ['dht22-t1']]);
    }

    public function test_can_filter_batches_by_zone(): void
    {
        $user   = User::factory()->create();
        $zoneA  = Zone::factory()->create();
        $zoneB  = Zone::factory()->create();
        $batchA = Batch::factory()->for($zoneA)->create();
        Batch::factory()->for($zoneB)->create();

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/batches?zone_id={$zoneA->id}");

        $response->assertOk()->assertJsonCount(1, 'data')->assertJsonFragment(['id' => $batchA->id]);
    }

    public function test_admin_can_create_a_batch_with_sensors(): void
    {
        $admin = User::factory()->admin()->create();
        $zone  = Zone::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/batches', [
            'zone_id'               => $zone->id,
            'name'                  => 'Salle de production',
            'storage_start_date'    => now()->toDateString(),
            'storage_duration_days' => 30,
            'sensors'               => ['dht22-t1', 'dht22-h1'],
        ]);

        $response->assertCreated()->assertJsonCount(2, 'sensors');
        $this->assertDatabaseHas('batches', ['name' => 'Salle de production']);
        $this->assertDatabaseHas('batch_sensors', ['sensor_name' => 'dht22-t1']);
    }

    public function test_viewer_cannot_create_a_batch(): void
    {
        $viewer = User::factory()->viewer()->create();
        $zone   = Zone::factory()->create();

        $response = $this->actingAs($viewer, 'sanctum')->postJson('/api/batches', [
            'zone_id'               => $zone->id,
            'name'                  => 'Salle de production',
            'storage_start_date'    => now()->toDateString(),
            'storage_duration_days' => 30,
        ]);

        $response->assertStatus(403);
    }

    public function test_creating_a_batch_validates_required_fields(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/batches', []);

        $response->assertStatus(422)->assertJsonValidationErrors([
            'zone_id', 'name', 'storage_start_date', 'storage_duration_days',
        ]);
    }

    public function test_can_show_a_single_batch(): void
    {
        $user  = User::factory()->create();
        $batch = Batch::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/batches/{$batch->id}");

        // Unlike store()/destroy(), show() returns the resource directly, which
        // Laravel auto-wraps in a "data" envelope.
        $response->assertOk()->assertJsonPath('data.id', $batch->id);
    }

    public function test_admin_can_update_a_batch_and_replace_its_sensors(): void
    {
        $admin = User::factory()->admin()->create();
        $batch = Batch::factory()->create();
        $batch->sensors()->create(['sensor_name' => 'old-sensor']);

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/batches/{$batch->id}", [
            'sensors' => ['new-sensor'],
        ]);

        $response->assertOk()->assertJsonFragment(['sensors' => ['new-sensor']]);
        $this->assertDatabaseMissing('batch_sensors', ['sensor_name' => 'old-sensor']);
        $this->assertDatabaseHas('batch_sensors', ['sensor_name' => 'new-sensor']);
    }

    public function test_viewer_cannot_update_a_batch(): void
    {
        $viewer = User::factory()->viewer()->create();
        $batch  = Batch::factory()->create();

        $response = $this->actingAs($viewer, 'sanctum')->putJson("/api/batches/{$batch->id}", [
            'name' => 'Renamed',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_a_batch(): void
    {
        $admin = User::factory()->admin()->create();
        $batch = Batch::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/batches/{$batch->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('batches', ['id' => $batch->id]);
    }

    public function test_viewer_cannot_delete_a_batch(): void
    {
        $viewer = User::factory()->viewer()->create();
        $batch  = Batch::factory()->create();

        $response = $this->actingAs($viewer, 'sanctum')->deleteJson("/api/batches/{$batch->id}");

        $response->assertStatus(403);
    }
}
