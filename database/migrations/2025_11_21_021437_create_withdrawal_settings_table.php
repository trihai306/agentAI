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
        Schema::create('withdrawal_settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('auto_approve_threshold', 15, 2)->default(1000000); // Số tiền tự động approve (1 triệu VND)
            $table->decimal('min_withdrawal', 15, 2)->default(50000); // Số tiền rút tối thiểu
            $table->decimal('max_withdrawal', 15, 2)->default(100000000); // Số tiền rút tối đa
            $table->decimal('fee_percentage', 5, 2)->default(0); // Phí phần trăm
            $table->decimal('fee_fixed', 15, 2)->default(0); // Phí cố định
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('withdrawal_settings');
    }
};
