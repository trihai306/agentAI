<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workflow extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'nodes', // Keep for backward compatibility
        'edges', // Keep for backward compatibility
        'tool_calls',
        'tasks',
        'metadata',
        'is_active',
        'is_public',
        'category',
        'usage_count',
        'last_used_at',
    ];

    protected $casts = [
        'nodes' => 'array', // Keep for backward compatibility
        'edges' => 'array', // Keep for backward compatibility
        'tool_calls' => 'array',
        'tasks' => 'array',
        'metadata' => 'array',
        'is_active' => 'boolean',
        'is_public' => 'boolean',
        'usage_count' => 'integer',
        'last_used_at' => 'datetime',
    ];

    /**
     * Get the user that owns the workflow.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the nodes for this workflow.
     */
    public function workflowNodes(): HasMany
    {
        return $this->hasMany(WorkflowNode::class)->orderBy('order');
    }

    /**
     * Get the edges for this workflow.
     */
    public function workflowEdges(): HasMany
    {
        return $this->hasMany(WorkflowEdge::class);
    }

    /**
     * Get nodes in ReactFlow format (from database or fallback to JSON).
     */
    public function getNodesAttribute($value)
    {
        // If we have workflowNodes relationship loaded, use that
        if ($this->relationLoaded('workflowNodes') && $this->workflowNodes->isNotEmpty()) {
            return $this->workflowNodes->map(function ($node) {
                return $node->toReactFlowNode();
            })->toArray();
        }

        // Otherwise, fallback to JSON column
        return $value ? json_decode($value, true) : [];
    }

    /**
     * Get edges in ReactFlow format (from database or fallback to JSON).
     */
    public function getEdgesAttribute($value)
    {
        // If we have workflowEdges relationship loaded, use that
        if ($this->relationLoaded('workflowEdges') && $this->workflowEdges->isNotEmpty()) {
            return $this->workflowEdges->map(function ($edge) {
                return $edge->toReactFlowEdge();
            })->toArray();
        }

        // Otherwise, fallback to JSON column
        return $value ? json_decode($value, true) : [];
    }

    /**
     * Save nodes and edges to database tables.
     */
    public function saveNodesAndEdges(array $nodes, array $edges): void
    {
        // Delete existing nodes and edges
        $this->workflowNodes()->delete();
        $this->workflowEdges()->delete();

        // Save nodes
        foreach ($nodes as $index => $node) {
            WorkflowNode::fromReactFlowNode($this->id, $node, $index);
        }

        // Save edges
        foreach ($edges as $edge) {
            WorkflowEdge::fromReactFlowEdge($this->id, $edge);
        }

        // Also update JSON columns for backward compatibility
        $this->update([
            'nodes' => $nodes,
            'edges' => $edges,
        ]);
    }

    /**
     * Increment usage count and update last used timestamp.
     */
    public function markAsUsed(): void
    {
        $this->increment('usage_count');
        $this->update(['last_used_at' => now()]);
    }
}
