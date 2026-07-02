<?php

namespace App\Services;

use App\Models\Zone;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class ExternalApiService
{
    public function __construct(private JwtTokenService $jwtService) {}

    /**
     * Retrieve the list of sensors (called "lots" in the external API) for a zone.
     */
    public function getSensors(Zone $zone): array
    {
        $token = $this->jwtService->getTokenForZone($zone)['token'];

        return $this->get($zone, '/api/v1/lot', [], $token);
    }

    /**
     * Retrieve historical measurements for a specific sensor.
     */
    public function getSensorMeasures(Zone $zone, string $sensorName, array $params = []): array
    {
        $token = $this->jwtService->getTokenForZone($zone)['token'];

        return $this->get($zone, "/api/v1/lot/{$sensorName}", $params, $token);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function get(Zone $zone, string $path, array $query, string $token): array
    {
        try {
            $response = Http::withToken($token)
                ->timeout(15)
                ->get(rtrim($zone->api_url, '/') . $path, $query);

            $response->throw();
        } catch (RequestException $e) {
            // If the token was rejected, invalidate the cache and retry once
            if ($e->response && $e->response->status() === 401) {
                $this->invalidateToken($zone);
                $freshToken = $this->jwtService->getTokenForZone($zone)['token'];

                $response = Http::withToken($freshToken)
                    ->timeout(15)
                    ->get(rtrim($zone->api_url, '/') . $path, $query);

                $response->throw();
            } else {
                throw new RuntimeException(
                    "External API call failed for zone '{$zone->name}': " . $e->getMessage(),
                    $e->getCode(),
                    $e,
                );
            }
        }

        return $response->json() ?? [];
    }

    private function invalidateToken(Zone $zone): void
    {
        $zone->token()->delete();
    }
}
