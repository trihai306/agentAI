<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDataItem extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'collection_id',
        'key',
        'value',
        'data_type',
        'label',
        'description',
        'order',
        'is_active',
        'metadata',
        'tags',
        'last_used_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'metadata' => 'array',
        'tags' => 'array',
        'order' => 'integer',
        'last_used_at' => 'datetime',
    ];

    /**
     * Get the collection that owns the item.
     */
    public function collection(): BelongsTo
    {
        return $this->belongsTo(UserDataCollection::class, 'collection_id');
    }

    /**
     * Scope a query to only include active items.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to filter by key.
     */
    public function scopeByKey($query, string $key)
    {
        return $query->where('key', $key);
    }

    /**
     * Scope a query to filter by data type.
     */
    public function scopeByDataType($query, string $dataType)
    {
        return $query->where('data_type', $dataType);
    }

    /**
     * Scope a query to filter by tags.
     */
    public function scopeByTag($query, string $tag)
    {
        return $query->whereJsonContains('tags', $tag);
    }

    /**
     * Get the value with proper type casting.
     */
    public function getValue()
    {
        $value = $this->value;

        if ($value === null) {
            return null;
        }

        switch ($this->data_type) {
            case 'number':
            case 'integer':
                return (int) $value;
            case 'float':
            case 'double':
                return (float) $value;
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'json':
            case 'array':
            case 'object':
                return json_decode($value, true);
            default:
                return $value;
        }
    }

    /**
     * Set the value with proper type handling.
     */
    public function setValue($value): void
    {
        if (is_array($value) || is_object($value)) {
            $this->data_type = 'json';
            $this->value = json_encode($value);
        } elseif (is_bool($value)) {
            $this->data_type = 'boolean';
            $this->value = $value ? '1' : '0';
        } elseif (is_int($value)) {
            $this->data_type = 'integer';
            $this->value = (string) $value;
        } elseif (is_float($value)) {
            $this->data_type = 'float';
            $this->value = (string) $value;
        } else {
            $this->data_type = 'string';
            $this->value = (string) $value;
        }
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
        return [
            'item_id' => $this->id,
            'key' => $this->key,
            'value' => $this->getValue(),
            'data_type' => $this->data_type,
            'label' => $this->label ?? $this->key,
            'description' => $this->description,
            'metadata' => $this->metadata,
            'tags' => $this->tags ?? [],
        ];
    }

    /**
     * Add a tag.
     */
    public function addTag(string $tag): void
    {
        $tags = $this->tags ?? [];
        if (!in_array($tag, $tags)) {
            $tags[] = $tag;
            $this->tags = $tags;
            $this->save();
        }
    }

    /**
     * Remove a tag.
     */
    public function removeTag(string $tag): void
    {
        $tags = $this->tags ?? [];
        $tags = array_values(array_filter($tags, fn($t) => $t !== $tag));
        $this->tags = $tags;
        $this->save();
    }
}
