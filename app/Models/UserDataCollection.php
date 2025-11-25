<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserDataCollection extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'type',
        'description',
        'icon',
        'color',
        'is_active',
        'is_public',
        'metadata',
        'item_count',
        'last_used_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_public' => 'boolean',
        'metadata' => 'array',
        'item_count' => 'integer',
        'last_used_at' => 'datetime',
    ];

    /**
     * Get the user that owns the collection.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the items for the collection.
     */
    public function items(): HasMany
    {
        return $this->hasMany(UserDataItem::class, 'collection_id')->orderBy('order');
    }

    /**
     * Get active items only.
     */
    public function activeItems(): HasMany
    {
        return $this->hasMany(UserDataItem::class, 'collection_id')
            ->where('is_active', true)
            ->orderBy('order');
    }

    /**
     * Scope a query to only include active collections.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include collections of a specific type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to only include public collections.
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Update item count.
     */
    public function updateItemCount(): void
    {
        $this->item_count = $this->items()->count();
        $this->save();
    }

    /**
     * Mark as used.
     */
    public function markAsUsed(): void
    {
        $this->last_used_at = now();
        $this->save();
    }

    /**
     * Get formatted data for workflow.
     */
    public function toWorkflowFormat(): array
    {
        $items = $this->activeItems()->get()->map(function ($item) {
            return $item->toWorkflowFormat();
        })->toArray();

        return [
            'collection_id' => $this->id,
            'collection_name' => $this->name,
            'collection_type' => $this->type,
            'items' => $items,
            'item_count' => count($items),
        ];
    }

    /**
     * Get as key-value pairs for easy access.
     */
    public function toKeyValuePairs(): array
    {
        $pairs = [];
        foreach ($this->activeItems as $item) {
            if ($item->key) {
                $pairs[$item->key] = $item->getValue();
            }
        }
        return $pairs;
    }
}
