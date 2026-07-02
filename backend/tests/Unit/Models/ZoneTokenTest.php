<?php

namespace Tests\Unit\Models;

use App\Models\ZoneToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ZoneTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_is_expired_is_true_once_expiry_date_is_in_the_past(): void
    {
        $token = ZoneToken::factory()->create(['expires_at' => now()->subMinute()]);

        $this->assertTrue($token->isExpired());
    }

    public function test_is_expired_is_false_while_expiry_date_is_in_the_future(): void
    {
        $token = ZoneToken::factory()->create(['expires_at' => now()->addHour()]);

        $this->assertFalse($token->isExpired());
    }

    public function test_is_valid_requires_more_than_five_minutes_before_expiry(): void
    {
        $comfortable = ZoneToken::factory()->create(['expires_at' => now()->addMinutes(10)]);
        $expiringSoon = ZoneToken::factory()->create(['expires_at' => now()->addMinutes(3)]);

        $this->assertTrue($comfortable->isValid());
        $this->assertFalse($expiringSoon->isValid());
    }
}
