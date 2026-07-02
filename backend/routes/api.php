<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ZoneController;
use App\Http\Controllers\BatchController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SensorController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\ZoneTokenController;

// ── Public ────────────────────────────────────────────────────────────────────
Route::post('/auth/login', [AuthController::class, 'login']);

// Webhook — protected by shared token, not Sanctum
Route::post('/webhook/alerts', [WebhookController::class, 'receive'])
    ->middleware('webhook.token');

// ── Authenticated ─────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',     [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Zones
    Route::apiResource('zones', ZoneController::class);
    Route::get('/zones/{zone}/token',   [ZoneTokenController::class, 'getToken']);
    Route::get('/zones/{zone}/sensors', [SensorController::class, 'index']);

    // Batches
    Route::apiResource('batches', BatchController::class);

    // Alerts
    Route::get('/alerts',                    [AlertController::class, 'index']);
    Route::patch('/alerts/{alert}/resolve',  [AlertController::class, 'resolve']);
});
