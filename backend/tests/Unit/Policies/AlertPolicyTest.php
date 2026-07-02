<?php

namespace Tests\Unit\Policies;

use App\Models\Alert;
use App\Models\User;
use App\Models\Zone;
use App\Policies\AlertPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AlertPolicyTest extends TestCase
{
    use RefreshDatabase;

    private AlertPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();

        $this->policy = new AlertPolicy();
    }

    public function test_any_authenticated_user_can_view_alerts(): void
    {
        $viewer = User::factory()->viewer()->create();

        $this->assertTrue($this->policy->viewAny($viewer));
    }

    public function test_only_admins_can_resolve_alerts(): void
    {
        $admin  = User::factory()->admin()->create();
        $viewer = User::factory()->viewer()->create();
        $alert  = Alert::factory()->for(Zone::factory())->create();

        $this->assertTrue($this->policy->resolve($admin, $alert));
        $this->assertFalse($this->policy->resolve($viewer, $alert));
    }
}
