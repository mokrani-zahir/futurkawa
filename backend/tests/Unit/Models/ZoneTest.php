<?php

namespace Tests\Unit\Models;

use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ZoneTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_password_is_encrypted_at_rest_and_decrypted_on_access(): void
    {
        $zone = Zone::factory()->create(['api_password' => 'super-secret']);

        $this->assertSame('super-secret', $zone->api_password);

        $rawValue = DB::table('zones')->where('id', $zone->id)->value('api_password');
        $this->assertNotSame('super-secret', $rawValue);
        $this->assertSame('super-secret', Crypt::decryptString($rawValue));
    }

    public function test_api_password_is_hidden_from_array_and_json_representation(): void
    {
        $zone = Zone::factory()->create();

        $this->assertArrayNotHasKey('api_password', $zone->toArray());
        $this->assertStringNotContainsString('api_password', $zone->toJson());
    }
}
