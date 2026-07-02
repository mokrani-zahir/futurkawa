<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\Batch;
use App\Models\Zone;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $activeAlerts   = Alert::where('is_resolved', false)->count();
        $resolvedAlerts = Alert::where('is_resolved', true)->count();

        $expiredBatches = Batch::whereRaw(
            "(storage_start_date + (storage_duration_days || ' days')::interval) < NOW()"
        )->count();

        return response()->json([
            'zones_count'      => Zone::count(),
            'batches_count'    => Batch::count(),
            'active_alerts'    => $activeAlerts,
            'resolved_alerts'  => $resolvedAlerts,
            'expired_batches'  => $expiredBatches,
        ]);
    }
}
