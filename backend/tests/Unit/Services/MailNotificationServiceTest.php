<?php

namespace Tests\Unit\Services;

use App\Mail\StorageExpiryMail;
use App\Models\Batch;
use App\Models\User;
use App\Services\MailNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class MailNotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_queues_expiry_notification_to_every_admin_only(): void
    {
        Mail::fake();

        $admin1 = User::factory()->admin()->create();
        $admin2 = User::factory()->admin()->create();
        $viewer = User::factory()->viewer()->create();
        $batch  = Batch::factory()->expired()->create();

        (new MailNotificationService())->sendExpiryNotification($batch);

        Mail::assertQueuedCount(2);
        Mail::assertQueued(StorageExpiryMail::class, fn ($mail) => $mail->hasTo($admin1->email) && $mail->batch->is($batch));
        Mail::assertQueued(StorageExpiryMail::class, fn ($mail) => $mail->hasTo($admin2->email));
        Mail::assertNotQueued(StorageExpiryMail::class, fn ($mail) => $mail->hasTo($viewer->email));
    }

    public function test_sends_nothing_when_there_are_no_admins(): void
    {
        Mail::fake();
        User::factory()->viewer()->create();
        $batch = Batch::factory()->expired()->create();

        (new MailNotificationService())->sendExpiryNotification($batch);

        Mail::assertNothingQueued();
    }
}
