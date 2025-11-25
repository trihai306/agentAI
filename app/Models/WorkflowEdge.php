<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowEdge extends Model
{
    protected $fillable = [
        'workflow_id',
        'edge_id',
        'source_node_id',
        'target_node_id',
        'type',
        'style',
        'marker_end',
        'animated',
        'metadata',
    ];

    protected $casts = [
        'style' => 'array',
        'marker_end' => 'array',
        'animated' => 'boolean',
        'metadata' => 'array',
    ];

    /**
     * Get the workflow that owns this edge.
     */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    /**
     * Convert to ReactFlow edge format.
     */
    public function toReactFlowEdge(): array
    {
        $edge = [
            'id' => $this->edge_id,
            'source' => $this->source_node_id,
            'target' => $this->target_node_id,
            'type' => $this->type,
        ];

        if ($this->style) {
            $edge['style'] = $this->style;
        }

        if ($this->marker_end) {
            $edge['markerEnd'] = $this->marker_end;
        }

        if ($this->animated) {
            $edge['animated'] = true;
        }

        return $edge;
    }

    /**
     * Create or update edge from ReactFlow edge format.
     */
    public static function fromReactFlowEdge(int $workflowId, array $reactFlowEdge): self
    {
        return self::updateOrCreate(
            [
                'workflow_id' => $workflowId,
                'edge_id' => $reactFlowEdge['id'],
            ],
            [
                'source_node_id' => $reactFlowEdge['source'],
                'target_node_id' => $reactFlowEdge['target'],
                'type' => $reactFlowEdge['type'] ?? 'smoothstep',
                'style' => $reactFlowEdge['style'] ?? null,
                'marker_end' => $reactFlowEdge['markerEnd'] ?? $reactFlowEdge['marker_end'] ?? null,
                'animated' => $reactFlowEdge['animated'] ?? false,
                'metadata' => $reactFlowEdge['metadata'] ?? null,
            ]
        );
    }
}
