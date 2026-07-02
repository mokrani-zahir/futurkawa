<?php

namespace App\Services;

use App\Models\Batch;

class StorageExpiryService
{
    public function __construct(
        private AlertService $alertService,
        private MailNotificationService $mailService,
    ) {}

    /**
     * Check every batch and trigger alerts + emails for expired ones.
     */
    public function checkAll(): void
    {
        // Use a DB expression to find batches whose storage period has elapsed
        $expired = Batch::with('zone')
            ->whereRaw(
                "(storage_start_date + (storage_duration_days || ' days')::interval) < NOW()"
            )
            ->get();

        foreach ($expired as $batch) {
            $alert = $this->alertService->createStorageExpiryAlert($batch);

            // Only send an email when a new alert was actually created
            if ($alert !== null) {
                $this->mailService->sendExpiryNotification($batch);
            }
        }
    }
}
