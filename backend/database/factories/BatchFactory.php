<?php

namespace Database\Factories;

use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\Factory;

class BatchFactory extends Factory
{
    public function definition(): array
    {
        return [
            'zone_id'               => Zone::factory(),
            'name'                  => fake()->words(2, true),
            'storage_start_date'    => now()->toDateString(),
            'storage_duration_days' => 30,
        ];
    }

    // Started far enough in the past that the storage duration has already elapsed
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'storage_start_date'    => now()->subDays(10)->toDateString(),
            'storage_duration_days' => 5,
        ]);
    }
}
