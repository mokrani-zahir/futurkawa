<?php

namespace Database\Factories;

use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\Factory;

class AlertFactory extends Factory
{
    public function definition(): array
    {
        return [
            'zone_id'     => Zone::factory(),
            'sensor_name' => 'dht22-t1',
            'type'        => 'webhook',
            'title'       => 'Alerte capteur : dht22-t1',
            'message'     => 'Valeur mesurée : 23.6',
            'raw_payload' => ['zone' => 'zone', 'lot' => 'dht22-t1', 'value' => 23.6],
            'is_resolved' => false,
        ];
    }

    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_resolved' => true,
            'resolved_at' => now(),
        ]);
    }
}
