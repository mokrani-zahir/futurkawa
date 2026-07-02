<?php

namespace Tests\Unit\Policies;

use App\Models\Batch;
use App\Models\User;
use App\Policies\BatchPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BatchPolicyTest extends TestCase
{
    use RefreshDatabase;

    private BatchPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();

        $this->policy = new BatchPolicy();
    }

    public function test_any_authenticated_user_can_view_batches(): void
    {
        $viewer = User::factory()->viewer()->create();
        $batch  = Batch::factory()->create();

        $this->assertTrue($this->policy->viewAny($viewer));
        $this->assertTrue($this->policy->view($viewer, $batch));
    }

    public function test_only_admins_can_create_update_or_delete_batches(): void
    {
        $admin  = User::factory()->admin()->create();
        $viewer = User::factory()->viewer()->create();
        $batch  = Batch::factory()->create();

        $this->assertTrue($this->policy->create($admin));
        $this->assertTrue($this->policy->update($admin, $batch));
        $this->assertTrue($this->policy->delete($admin, $batch));

        $this->assertFalse($this->policy->create($viewer));
        $this->assertFalse($this->policy->update($viewer, $batch));
        $this->assertFalse($this->policy->delete($viewer, $batch));
    }
}
