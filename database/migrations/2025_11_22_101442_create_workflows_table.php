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
        Schema::create('workflows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->comment('Owner user');
            $table->string('name')->comment('Workflow name');
            $table->text('description')->nullable()->comment('Workflow description');
            $table->json('nodes')->nullable()->comment('ReactFlow nodes data');
            $table->json('edges')->nullable()->comment('ReactFlow edges data');
            $table->json('tool_calls')->nullable()->comment('Tool calls from AI');
            $table->json('tasks')->nullable()->comment('Task list data');
            $table->json('metadata')->nullable()->comment('Additional metadata');
            $table->boolean('is_active')->default(true)->comment('Workflow is active');
            $table->boolean('is_public')->default(false)->comment('Workflow is public/shared');
            $table->string('category')->nullable()->comment('Workflow category');
            $table->integer('usage_count')->default(0)->comment('Number of times used');
            $table->timestamp('last_used_at')->nullable()->comment('Last time workflow was used');
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
            $table->index(['is_public', 'is_active']);
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflows');
    }
};
