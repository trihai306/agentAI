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
        Schema::create('user_data_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name'); // Tên collection (ví dụ: "Danh sách tài khoản", "Comments")
            $table->string('type'); // Loại collection (accounts, comments, posts, products, etc.)
            $table->text('description')->nullable(); // Mô tả collection
            $table->string('icon')->nullable(); // Icon cho collection (emoji hoặc icon name)
            $table->string('color')->nullable(); // Màu sắc cho collection (hex color)
            $table->boolean('is_active')->default(true); // Trạng thái active
            $table->boolean('is_public')->default(false); // Có công khai không
            $table->json('metadata')->nullable(); // Metadata bổ sung (JSON)
            $table->integer('item_count')->default(0); // Số lượng items trong collection
            $table->timestamp('last_used_at')->nullable(); // Lần cuối sử dụng
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'is_active']);
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_data_collections');
    }
};
