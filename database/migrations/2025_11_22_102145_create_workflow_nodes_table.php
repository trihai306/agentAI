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
        Schema::create('workflow_nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained()->onDelete('cascade')->comment('Parent workflow');
            $table->string('node_id')->comment('ReactFlow node ID');
            $table->string('type')->default('custom')->comment('Node type (custom, default, etc.)');
            $table->decimal('position_x', 10, 2)->default(0)->comment('X position');
            $table->decimal('position_y', 10, 2)->default(0)->comment('Y position');
            $table->json('data')->nullable()->comment('Node data (label, description, status, toolCall, etc.)');
            $table->integer('order')->default(0)->comment('Order in workflow');
            $table->json('style')->nullable()->comment('Node style (width, height, etc.)');
            $table->json('metadata')->nullable()->comment('Additional metadata');
            $table->timestamps();

            $table->index(['workflow_id', 'order']);
            $table->index('node_id');
            $table->unique(['workflow_id', 'node_id']); // Ensure unique node_id per workflow
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_nodes');
    }
};
