<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use App\Services\AlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function __construct(private AlertService $alertService) {}

    /**
     * Receive an alert pushed by an external API.
     *
     * The request must carry the shared secret in the Authorization header.
     * The middleware WebhookTokenMiddleware enforces this before the controller runs.
     *
     * Expected payload example:
     *   { "zone": "brazil", "lot": "dht22-t1", "value": 23.6, "timestamp": 1782894384 }
     */
    public function receive(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'zone'      => ['required', 'string'],
            'lot'       => ['nullable', 'string'],
            'value'     => ['nullable', 'numeric'],
            // Senders vary between unix epoch (int) and ISO 8601 strings —
            // it's stored as-is in raw_payload, never parsed, so accept either.
            'timestamp' => ['nullable'],
        ]);

        // Match the incoming zone name to a stored zone by api_url or name (best effort)
        $zone = Zone::where('name', $payload['zone'])->first();

        if (! $zone) {
            $alert = $this->alertService->createUnknownZoneAlert($payload);

            return response()->json([
                'message' => $alert
                    ? 'Alerte enregistrée (zone non reconnue).'
                    : 'Alerte déjà active pour cette zone non reconnue, ignorée.',
            ], 202);
        }

        $alert = $this->alertService->createWebhookAlert($zone, $payload);

        return response()->json([
            'message' => $alert
                ? 'Alerte reçue.'
                : 'Alerte déjà active pour ce capteur, ignorée.',
        ], 202);
    }
}
