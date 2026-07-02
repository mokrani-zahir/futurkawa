<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class Zone extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'api_url',
        'api_username',
        'api_password',
    ];

    protected $hidden = [
        'api_password',
    ];

    // Encrypt password on write, decrypt on read
    public function setApiPasswordAttribute(string $value): void
    {
        $this->attributes['api_password'] = Crypt::encryptString($value);
    }

    public function getApiPasswordAttribute(string $value): string
    {
        return Crypt::decryptString($value);
    }

    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }

    public function token(): HasMany
    {
        return $this->hasMany(ZoneToken::class);
    }
}
