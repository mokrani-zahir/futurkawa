<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBatchRequest;
use App\Http\Requests\UpdateBatchRequest;
use App\Http\Resources\BatchResource;
use App\Models\Batch;
use App\Models\Zone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BatchController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Batch::with(['sensors', 'zone']);

        if ($request->has('zone_id')) {
            $query->where('zone_id', $request->zone_id);
        }

        return BatchResource::collection($query->get());
    }

    public function store(StoreBatchRequest $request): JsonResponse
    {
        $zone = Zone::findOrFail($request->zone_id);
        $this->authorize('create', [Batch::class, $zone]);

        $data    = $request->validated();
        $sensors = $data['sensors'] ?? [];
        unset($data['sensors']);

        $batch = Batch::create($data);

        if (! empty($sensors)) {
            $batch->sensors()->createMany(
                array_map(fn($name) => ['sensor_name' => $name], $sensors)
            );
        }

        return response()->json(new BatchResource($batch->load('sensors')), 201);
    }

    public function show(Batch $batch): BatchResource
    {
        return new BatchResource($batch->load(['sensors', 'zone']));
    }

    public function update(UpdateBatchRequest $request, Batch $batch): BatchResource
    {
        $this->authorize('update', $batch);

        $data    = $request->validated();
        $sensors = $data['sensors'] ?? null;
        unset($data['sensors']);

        $batch->update($data);

        if ($sensors !== null) {
            $batch->sensors()->delete();
            $batch->sensors()->createMany(
                array_map(fn($name) => ['sensor_name' => $name], $sensors)
            );
        }

        return new BatchResource($batch->load('sensors'));
    }

    public function destroy(Batch $batch): JsonResponse
    {
        $this->authorize('delete', $batch);

        $batch->delete();

        return response()->json(null, 204);
    }
}
