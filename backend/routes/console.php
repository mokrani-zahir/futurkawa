<?php

use Illuminate\Support\Facades\Schedule;

// Run storage-expiry check every hour
Schedule::command('futurekawa:check-storage-expiry')->hourly();
