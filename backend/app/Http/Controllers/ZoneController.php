<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreZoneRequest;
use App\Http\Requests\UpdateZoneRequest;
use App\Http\Resources\ZoneResource;
use App\Models\Zone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ZoneController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ZoneResource::collection(Zone::withCount(['batches', 'alerts'])->get());
    }

    public function store(StoreZoneRequest $request): JsonResponse
    {
        $this->authorize('create', Zone::class);

        $zone = Zone::create($request->validated());

        return response()->json(new ZoneResource($zone), 201);
    }

    public function show(Zone $zone): ZoneResource
    {
        $zone->loadCount(['batches', 'alerts']);

        return new ZoneResource($zone);
    }

    public function update(UpdateZoneRequest $request, Zone $zone): ZoneResource
    {
        $this->authorize('update', $zone);

        $zone->update($request->validated());

        return new ZoneResource($zone);
    }

    public function destroy(Zone $zone): JsonResponse
    {
        $this->authorize('delete', $zone);

        $zone->delete();

        return response()->json(null, 204);
    }
}
