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
        Schema::create('workflow_edges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained()->onDelete('cascade')->comment('Parent workflow');
            $table->string('edge_id')->comment('ReactFlow edge ID');
            $table->string('source_node_id')->comment('Source node ID');
            $table->string('target_node_id')->comment('Target node ID');
            $table->string('type')->default('smoothstep')->comment('Edge type (smoothstep, default, etc.)');
            $table->json('style')->nullable()->comment('Edge style (stroke, strokeWidth, etc.)');
            $table->json('marker_end')->nullable()->comment('Marker end configuration');
            $table->boolean('animated')->default(false)->comment('Edge is animated');
            $table->json('metadata')->nullable()->comment('Additional metadata');
            $table->timestamps();

            $table->index(['workflow_id', 'source_node_id']);
            $table->index(['workflow_id', 'target_node_id']);
            $table->unique(['workflow_id', 'edge_id']); // Ensure unique edge_id per workflow
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_edges');
    }
};
