<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowNode extends Model
{
    protected $fillable = [
        'workflow_id',
        'node_id',
        'type',
        'position_x',
        'position_y',
        'data',
        'order',
        'style',
        'metadata',
    ];

    protected $casts = [
        'position_x' => 'decimal:2',
        'position_y' => 'decimal:2',
        'data' => 'array',
        'order' => 'integer',
        'style' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Get the workflow that owns this node.
     */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    /**
     * Convert to ReactFlow node format.
     */
    public function toReactFlowNode(): array
    {
        return [
            'id' => $this->node_id,
            'type' => $this->type,
            'position' => [
                'x' => (float) $this->position_x,
                'y' => (float) $this->position_y,
            ],
            'data' => $this->data ?? [],
            'style' => $this->style,
        ];
    }

    /**
     * Create or update node from ReactFlow node format.
     */
    public static function fromReactFlowNode(int $workflowId, array $reactFlowNode, int $order = 0): self
    {
        return self::updateOrCreate(
            [
                'workflow_id' => $workflowId,
                'node_id' => $reactFlowNode['id'],
            ],
            [
                'type' => $reactFlowNode['type'] ?? 'custom',
                'position_x' => $reactFlowNode['position']['x'] ?? 0,
                'position_y' => $reactFlowNode['position']['y'] ?? 0,
                'data' => $reactFlowNode['data'] ?? [],
                'order' => $order,
                'style' => $reactFlowNode['style'] ?? null,
                'metadata' => $reactFlowNode['metadata'] ?? null,
            ]
        );
    }
}
