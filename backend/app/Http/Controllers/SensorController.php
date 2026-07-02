<?php

namespace App\Http\Controllers;

use App\Http\Resources\SensorResource;
use App\Models\Zone;
use App\Services\ExternalApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SensorController extends Controller
{
    public function __construct(private ExternalApiService $apiService) {}

    /**
     * List all sensors available on the external API for a given zone.
     * Used by the frontend when creating/editing a batch to pick sensors.
     */
    public function index(Zone $zone): JsonResponse
    {
        $sensors = $this->apiService->getSensors($zone);

        return response()->json(['data' => $sensors]);
    }
}
