<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('udid')->unique()->comment('Unique Device Identifier');
            $table->string('name')->nullable()->comment('Device name');
            $table->string('model')->nullable()->comment('Device model');
            $table->enum('platform', ['android', 'ios', 'unknown'])->default('unknown')->comment('Platform type');
            $table->string('version')->nullable()->comment('OS version');
            $table->enum('status', ['device', 'offline', 'unauthorized', 'unknown'])->default('unknown')->comment('Connection status');
            $table->json('screen_size')->nullable()->comment('Screen dimensions {width, height}');
            $table->enum('orientation', ['portrait', 'landscape'])->nullable()->comment('Current orientation');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null')->comment('Owner user');
            $table->boolean('is_active')->default(true)->comment('Device is active');
            $table->timestamp('last_seen_at')->nullable()->comment('Last connection time');
            $table->json('metadata')->nullable()->comment('Additional device information');
            $table->timestamps();

            $table->index(['status', 'platform']);
            $table->index('last_seen_at');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
