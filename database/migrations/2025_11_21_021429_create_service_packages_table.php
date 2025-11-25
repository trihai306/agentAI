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
        Schema::create('service_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['messages', 'api_calls', 'storage']);
            $table->bigInteger('quota'); // Số lượng quota
            $table->decimal('price', 15, 2);
            $table->integer('duration_days')->nullable(); // Số ngày sử dụng, null = vô thời hạn
            $table->text('description')->nullable();
            $table->json('features')->nullable(); // Danh sách tính năng
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_packages');
    }
};
