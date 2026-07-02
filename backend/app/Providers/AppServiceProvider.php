<?php

namespace App\Providers;

use App\Models\Alert;
use App\Models\Batch;
use App\Models\Zone;
use App\Policies\AlertPolicy;
use App\Policies\BatchPolicy;
use App\Policies\ZonePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::policy(Zone::class, ZonePolicy::class);
        Gate::policy(Batch::class, BatchPolicy::class);
        Gate::policy(Alert::class, AlertPolicy::class);
    }
}
