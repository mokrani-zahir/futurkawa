<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'zone_id'               => $this->zone_id,
            'zone'                  => new ZoneResource($this->whenLoaded('zone')),
            'name'                  => $this->name,
            'storage_start_date'    => $this->storage_start_date->toDateString(),
            'storage_duration_days' => $this->storage_duration_days,
            'expires_at'            => $this->expires_at->toDateString(),
            'is_expired'            => $this->is_expired,
            'sensors'               => $this->whenLoaded(
                'sensors',
                fn() => $this->sensors->pluck('sensor_name')
            ),
            'created_at'            => $this->created_at->toIso8601String(),
            'updated_at'            => $this->updated_at->toIso8601String(),
        ];
    }
}
