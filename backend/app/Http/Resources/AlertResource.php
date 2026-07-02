<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlertResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'zone_id'     => $this->zone_id,
            'zone'        => new ZoneResource($this->whenLoaded('zone')),
            'batch_id'    => $this->batch_id,
            'batch'       => new BatchResource($this->whenLoaded('batch')),
            'sensor_name' => $this->sensor_name,
            'type'        => $this->type,
            'title'       => $this->title,
            'message'     => $this->message,
            'is_resolved' => $this->is_resolved,
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'resolved_by' => new UserResource($this->whenLoaded('resolvedBy')),
            'created_at'  => $this->created_at->toIso8601String(),
        ];
    }
}
