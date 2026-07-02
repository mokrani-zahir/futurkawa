<?php

namespace App\Services;

use App\Models\Zone;
use App\Models\ZoneToken;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class JwtTokenService
{
    /**
     * Return a valid JWT for the given zone, refreshing it if necessary.
     *
     * @return array{token: string, expires_at: \Carbon\Carbon}
     */
    public function getTokenForZone(Zone $zone): array
    {
        $cached = ZoneToken::where('zone_id', $zone->id)->latest()->first();

        if ($cached && $cached->isValid()) {
            return ['token' => $cached->token, 'expires_at' => $cached->expires_at];
        }

        return $this->fetchAndCacheToken($zone);
    }

    /**
     * Authenticate against the external API and persist the returned JWT.
     *
     * @return array{token: string, expires_at: \Carbon\Carbon}
     */
    private function fetchAndCacheToken(Zone $zone): array
    {
        try {
            $response = Http::timeout(10)->get(
                rtrim($zone->api_url, '/') . '/api/v1/jwt',
                [
                    'username'  => $zone->api_username,
                    'password'  => $zone->api_password, // decrypted by Zone accessor
                    'expiresIn' => 3600,
                ]
            );

            $response->throw();
        } catch (RequestException $e) {
            throw new RuntimeException(
                "Failed to obtain JWT for zone '{$zone->name}': " . $e->getMessage(),
                $e->getCode(),
                $e,
            );
        }

        $data      = $response->json();
        $expiresIn = (int) ($data['expiresIn'] ?? 3600);
        $expiresAt = now()->addSeconds($expiresIn);

        ZoneToken::updateOrCreate(
            ['zone_id' => $zone->id],
            ['token' => $data['token'], 'expires_at' => $expiresAt]
        );

        return ['token' => $data['token'], 'expires_at' => $expiresAt];
    }
}
