<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batch_sensors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('batch_id')->constrained()->cascadeOnDelete();
            $table->string('sensor_name'); // corresponds to "lot" name in the external API
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['batch_id', 'sensor_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batch_sensors');
    }
};
