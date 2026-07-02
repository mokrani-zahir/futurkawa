<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ZoneFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'         => fake()->unique()->city(),
            'api_url'      => 'https://' . fake()->unique()->domainName() . '/api',
            'api_username' => fake()->userName(),
            'api_password' => fake()->password(),
        ];
    }
}
