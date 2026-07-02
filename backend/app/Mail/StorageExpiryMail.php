<?php

namespace App\Mail;

use App\Models\Batch;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StorageExpiryMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public readonly Batch $batch) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[FutureKawa] Durée de stockage dépassée : {$this->batch->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.storage_expiry',
        );
    }
}
