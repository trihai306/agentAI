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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['deposit', 'withdrawal', 'purchase', 'refund']);
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('VND');
            $table->enum('status', ['pending', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->enum('payment_method', ['bank_transfer', 'momo', 'zalopay', 'credit_card', 'wallet'])->nullable();
            $table->json('payment_info')->nullable(); // Thông tin thanh toán (số tài khoản, số điện thoại, v.v.)
            $table->string('reference_code')->unique(); // Mã tham chiếu giao dịch
            $table->text('description')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->json('metadata')->nullable(); // Thông tin bổ sung
            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['status', 'type']);
            $table->index('reference_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
