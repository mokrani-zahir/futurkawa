<?php

namespace Tests\Unit\Policies;

use App\Models\User;
use App\Models\Zone;
use App\Policies\ZonePolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ZonePolicyTest extends TestCase
{
    use RefreshDatabase;

    private ZonePolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();

        $this->policy = new ZonePolicy();
    }

    public function test_any_authenticated_user_can_view_zones(): void
    {
        $viewer = User::factory()->viewer()->create();
        $zone   = Zone::factory()->create();

        $this->assertTrue($this->policy->viewAny($viewer));
        $this->assertTrue($this->policy->view($viewer, $zone));
    }

    public function test_only_admins_can_create_update_or_delete_zones(): void
    {
        $admin  = User::factory()->admin()->create();
        $viewer = User::factory()->viewer()->create();
        $zone   = Zone::factory()->create();

        $this->assertTrue($this->policy->create($admin));
        $this->assertTrue($this->policy->update($admin, $zone));
        $this->assertTrue($this->policy->delete($admin, $zone));

        $this->assertFalse($this->policy->create($viewer));
        $this->assertFalse($this->policy->update($viewer, $zone));
        $this->assertFalse($this->policy->delete($viewer, $zone));
    }
}
