<?php

namespace Tests\Unit\Models;

use App\Models\Batch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_is_expired_is_false_while_storage_duration_has_not_elapsed(): void
    {
        $batch = Batch::factory()->create([
            'storage_start_date'    => now()->toDateString(),
            'storage_duration_days' => 30,
        ]);

        $this->assertFalse($batch->is_expired);
    }

    public function test_is_expired_is_true_once_storage_duration_has_elapsed(): void
    {
        $batch = Batch::factory()->create([
            'storage_start_date'    => now()->subDays(31)->toDateString(),
            'storage_duration_days' => 30,
        ]);

        $this->assertTrue($batch->is_expired);
    }

    public function test_expires_at_is_start_date_plus_duration(): void
    {
        $start = now()->subDays(5)->startOfDay();
        $batch = Batch::factory()->create([
            'storage_start_date'    => $start->toDateString(),
            'storage_duration_days' => 10,
        ]);

        $this->assertTrue($batch->expires_at->isSameDay($start->copy()->addDays(10)));
    }
}
