<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ZoneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'api_url'        => $this->api_url,
            'api_username'   => $this->api_username,
            // api_password is intentionally omitted
            'batches_count'  => $this->whenCounted('batches'),
            'alerts_count'   => $this->whenCounted('alerts'),
            'created_at'     => $this->created_at->toIso8601String(),
            'updated_at'     => $this->updated_at->toIso8601String(),
        ];
    }
}
