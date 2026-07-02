<?php

namespace Tests\Feature;

use App\Models\Alert;
use App\Models\Batch;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_dashboard_stats(): void
    {
        $this->getJson('/api/dashboard/stats')->assertStatus(401);
    }

    public function test_returns_aggregate_counts(): void
    {
        $user = User::factory()->create();
        $zone = Zone::factory()->create();

        // Each of these factories creates its own Zone unless one is supplied,
        // so counts are asserted as deltas rather than hard-coded totals.
        Batch::factory()->for($zone)->count(3)->create();
        Batch::factory()->for($zone)->expired()->create();
        Alert::factory()->for($zone)->create(['is_resolved' => false]);
        Alert::factory()->for($zone)->resolved()->count(2)->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/dashboard/stats');

        $response->assertOk()->assertJson([
            'zones_count'     => 1,
            'batches_count'   => 4,
            'active_alerts'   => 1,
            'resolved_alerts' => 2,
            'expired_batches' => 1,
        ]);
    }
}
