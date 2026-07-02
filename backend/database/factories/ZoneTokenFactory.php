<?php

namespace Database\Factories;

use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\Factory;

class ZoneTokenFactory extends Factory
{
    public function definition(): array
    {
        return [
            'zone_id'    => Zone::factory(),
            'token'      => fake()->sha256(),
            'expires_at' => now()->addHour(),
        ];
    }
}
