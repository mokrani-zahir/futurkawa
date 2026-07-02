<?php

namespace App\Http\Controllers;

use App\Http\Resources\AlertResource;
use App\Models\Alert;
use App\Services\AlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AlertController extends Controller
{
    public function __construct(private AlertService $alertService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Alert::with(['zone', 'batch', 'resolvedBy'])
            ->orderBy('created_at', 'desc');

        if ($request->has('zone_id')) {
            $query->where('zone_id', $request->zone_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->boolean('unresolved_only')) {
            $query->where('is_resolved', false);
        }

        if ($request->boolean('resolved_only')) {
            $query->where('is_resolved', true);
        }

        return AlertResource::collection($query->paginate(10));
    }

    public function resolve(Alert $alert): JsonResponse
    {
        if ($alert->is_resolved) {
            return response()->json(['message' => 'Cette alerte est déjà résolue.'], 422);
        }

        $resolved = $this->alertService->resolve($alert, request()->user());

        return response()->json(new AlertResource($resolved));
    }
}
