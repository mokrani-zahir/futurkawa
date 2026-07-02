<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL', 'admin@futurekawa.local');

        // Idempotent: only create if the admin does not already exist
        if (User::where('email', $email)->exists()) {
            return;
        }

        User::create([
            'name'     => env('ADMIN_NAME', 'Administrateur'),
            'email'    => $email,
            'password' => Hash::make(env('ADMIN_PASSWORD', 'changeme123')),
            'role'     => 'admin',
        ]);
    }
}
