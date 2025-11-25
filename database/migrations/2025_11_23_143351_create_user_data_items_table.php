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
        Schema::create('user_data_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id')->constrained('user_data_collections')->onDelete('cascade');
            $table->string('key')->nullable(); // Key của item (ví dụ: "username", "email", "id")
            $table->text('value')->nullable(); // Giá trị (có thể là JSON string)
            $table->string('data_type')->default('string'); // Loại dữ liệu: string, number, boolean, json, array, object
            $table->string('label')->nullable(); // Label hiển thị
            $table->text('description')->nullable(); // Mô tả item
            $table->integer('order')->default(0); // Thứ tự sắp xếp
            $table->boolean('is_active')->default(true); // Trạng thái active
            $table->json('metadata')->nullable(); // Metadata bổ sung (JSON)
            $table->json('tags')->nullable(); // Tags để filter/search (JSON array)
            $table->timestamp('last_used_at')->nullable(); // Lần cuối sử dụng
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['collection_id', 'is_active']);
            $table->index(['collection_id', 'order']);
            $table->index('key');
            $table->index('data_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_data_items');
    }
};
