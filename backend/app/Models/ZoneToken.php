<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ZoneToken extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'zone_id',
        'token',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    // Valid if it expires more than 5 minutes from now
    public function isValid(): bool
    {
        return $this->expires_at->isAfter(now()->addMinutes(5));
    }
}
