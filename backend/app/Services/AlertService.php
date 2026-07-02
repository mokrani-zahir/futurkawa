<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\Batch;
use App\Models\User;
use App\Models\Zone;

class AlertService
{
    /**
     * Create an alert from a webhook payload sent by an external API.
     *
     * Sensors can re-send the same alert every few seconds, so we only create
     * a new row if there is no unresolved webhook alert already open for this
     * zone/sensor — otherwise the alert list would be flooded with duplicates.
     * Returns null when an unresolved alert already exists (nothing to do).
     */
    public function createWebhookAlert(Zone $zone, array $payload): ?Alert
    {
        $sensorName = $payload['lot'] ?? null;

        $alreadyActive = Alert::where('zone_id', $zone->id)
            ->where('sensor_name', $sensorName)
            ->where('type', 'webhook')
            ->where('is_resolved', false)
            ->exists();

        if ($alreadyActive) {
            return null;
        }

        return Alert::create([
            'zone_id'     => $zone->id,
            'sensor_name' => $sensorName,
            'type'        => 'webhook',
            'title'       => $sensorName
                ? "Alerte capteur : {$sensorName}"
                : "Alerte reçue depuis {$zone->name}",
            'message'     => isset($payload['value'])
                ? "Valeur mesurée : {$payload['value']}"
                : 'Alerte reçue depuis l\'API distante.',
            'raw_payload' => $payload,
        ]);
    }

    /**
     * Create an alert when a webhook payload's zone name doesn't match any
     * stored zone. Same dedup rule as createWebhookAlert(): only one
     * unresolved alert per (unknown zone name, sensor) at a time.
     */
    public function createUnknownZoneAlert(array $payload): ?Alert
    {
        $zoneName   = $payload['zone'] ?? null;
        $sensorName = $payload['lot'] ?? null;

        $alreadyActive = Alert::whereNull('zone_id')
            ->where('sensor_name', $sensorName)
            ->where('title', "Alerte zone inconnue : {$zoneName}")
            ->where('is_resolved', false)
            ->exists();

        if ($alreadyActive) {
            return null;
        }

        return Alert::create([
            'type'        => 'webhook',
            'sensor_name' => $sensorName,
            'title'       => "Alerte zone inconnue : {$zoneName}",
            'message'     => 'Zone non trouvée dans l\'application.',
            'raw_payload' => $payload,
        ]);
    }

    /**
     * Create a local alert when a batch has exceeded its storage duration.
     * Returns null if an unresolved alert already exists for this batch.
     */
    public function createStorageExpiryAlert(Batch $batch): ?Alert
    {
        $alreadyActive = Alert::where('batch_id', $batch->id)
            ->where('type', 'storage_expiry')
            ->where('is_resolved', false)
            ->exists();

        if ($alreadyActive) {
            return null;
        }

        return Alert::create([
            'zone_id'  => $batch->zone_id,
            'batch_id' => $batch->id,
            'type'     => 'storage_expiry',
            'title'    => "Durée de stockage dépassée : {$batch->name}",
            'message'  => "Le lot \"{$batch->name}\" a dépassé sa durée de stockage "
                . "de {$batch->storage_duration_days} jours "
                . "(démarré le {$batch->storage_start_date->toDateString()}).",
        ]);
    }

    /**
     * Mark an alert as resolved by the given user.
     */
    public function resolve(Alert $alert, User $user): Alert
    {
        $alert->update([
            'is_resolved' => true,
            'resolved_at' => now(),
            'resolved_by' => $user->id,
        ]);

        return $alert->fresh();
    }
}
