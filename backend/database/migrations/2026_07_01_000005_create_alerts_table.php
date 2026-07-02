<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('zone_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('batch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('sensor_name')->nullable();
            $table->enum('type', ['webhook', 'storage_expiry']);
            $table->string('title');
            $table->text('message');
            $table->jsonb('raw_payload')->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['is_resolved', 'created_at']);
            $table->index(['zone_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
