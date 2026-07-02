<?php

namespace App\Console\Commands;

use App\Services\StorageExpiryService;
use Illuminate\Console\Command;

class CheckStorageExpiry extends Command
{
    protected $signature   = 'futurekawa:check-storage-expiry';
    protected $description = 'Detect expired batches and create local alerts with email notification';

    public function handle(StorageExpiryService $service): int
    {
        $this->info('Checking storage expiry for all batches…');

        $service->checkAll();

        $this->info('Done.');

        return self::SUCCESS;
    }
}
