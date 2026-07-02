<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use App\Services\JwtTokenService;
use Illuminate\Http\JsonResponse;

class ZoneTokenController extends Controller
{
    public function __construct(private JwtTokenService $jwtService) {}

    /**
     * Return a valid JWT for the given zone so the frontend can connect
     * directly to the external API (REST + WebSocket) without ever seeing
     * the raw credentials stored on the backend.
     */
    public function getToken(Zone $zone): JsonResponse
    {
        try {
            $tokenData = $this->jwtService->getTokenForZone($zone);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => 'Impossible d\'obtenir le JWT : ' . $e->getMessage(),
            ], 502);
        }

        return response()->json([
            'token'      => $tokenData['token'],
            'expires_at' => $tokenData['expires_at']->toIso8601String(),
            'ws_url'     => rtrim($zone->api_url, '/') . '/ws/',
        ]);
    }
}
