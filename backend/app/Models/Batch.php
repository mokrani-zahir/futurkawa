<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Batch extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'zone_id',
        'name',
        'storage_start_date',
        'storage_duration_days',
    ];

    protected function casts(): array
    {
        return [
            'storage_start_date'    => 'date',
            'storage_duration_days' => 'integer',
        ];
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    public function sensors(): HasMany
    {
        return $this->hasMany(BatchSensor::class);
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }

    // Computed: true when the storage period has elapsed
    public function getIsExpiredAttribute(): bool
    {
        $expiry = Carbon::parse($this->storage_start_date)
            ->addDays($this->storage_duration_days);

        return $expiry->isPast();
    }

    public function getExpiresAtAttribute(): Carbon
    {
        return Carbon::parse($this->storage_start_date)
            ->addDays($this->storage_duration_days);
    }
}
