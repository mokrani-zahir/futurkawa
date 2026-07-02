<?php

namespace App\Services;

use App\Mail\StorageExpiryMail;
use App\Models\Batch;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class MailNotificationService
{
    /**
     * Send a storage-expiry notification to every admin.
     */
    public function sendExpiryNotification(Batch $batch): void
    {
        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            Mail::to($admin->email)->queue(new StorageExpiryMail($batch));
        }
    }
}
