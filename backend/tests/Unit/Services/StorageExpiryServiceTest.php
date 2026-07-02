<?php

namespace Tests\Unit\Services;

use App\Mail\StorageExpiryMail;
use App\Models\Alert;
use App\Models\Batch;
use App\Models\User;
use App\Services\AlertService;
use App\Services\MailNotificationService;
use App\Services\StorageExpiryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class StorageExpiryServiceTest extends TestCase
{
    use RefreshDatabase;

    private StorageExpiryService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new StorageExpiryService(new AlertService(), new MailNotificationService());
    }

    public function test_creates_an_alert_and_emails_admins_for_an_expired_batch(): void
    {
        Mail::fake();
        $admin  = User::factory()->admin()->create();
        $viewer = User::factory()->viewer()->create();
        $batch  = Batch::factory()->expired()->create();

        $this->service->checkAll();

        $this->assertDatabaseHas('alerts', [
            'batch_id' => $batch->id,
            'type'     => 'storage_expiry',
        ]);

        Mail::assertQueued(StorageExpiryMail::class, fn ($mail) => $mail->hasTo($admin->email));
        Mail::assertNotQueued(StorageExpiryMail::class, fn ($mail) => $mail->hasTo($viewer->email));
    }

    public function test_ignores_batches_that_have_not_expired_yet(): void
    {
        Mail::fake();
        Batch::factory()->create([
            'storage_start_date'    => now()->toDateString(),
            'storage_duration_days' => 30,
        ]);

        $this->service->checkAll();

        $this->assertSame(0, Alert::count());
        Mail::assertNothingQueued();
    }

    public function test_does_not_resend_mail_when_an_unresolved_alert_already_exists(): void
    {
        Mail::fake();
        User::factory()->admin()->create();
        $batch = Batch::factory()->expired()->create();

        $this->service->checkAll();
        Mail::assertQueuedCount(1);

        $this->service->checkAll();

        $this->assertSame(1, Alert::where('batch_id', $batch->id)->count());
        Mail::assertQueuedCount(1); // still just the one from the first run
    }
}
