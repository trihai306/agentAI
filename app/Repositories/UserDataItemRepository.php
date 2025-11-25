<?php

namespace App\Repositories;

use App\Models\UserDataCollection;
use App\Models\UserDataItem;
use App\Repositories\Contracts\UserDataItemRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class UserDataItemRepository implements UserDataItemRepositoryInterface
{
    /**
     * Get all items for a collection with pagination.
     */
    public function getAll(int $collectionId, array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        $query = UserDataItem::where('collection_id', $collectionId);

        // Apply filters
        $this->applyFilters($query, $filters);

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'order';
        $sortOrder = $filters['sort_order'] ?? 'asc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Get all items for a collection without pagination.
     */
    public function getAllWithoutPagination(int $collectionId, array $filters = []): Collection
    {
        $query = UserDataItem::where('collection_id', $collectionId);

        // Apply filters
        $this->applyFilters($query, $filters);

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'order';
        $sortOrder = $filters['sort_order'] ?? 'asc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->get();
    }

    /**
     * Find an item by ID.
     */
    public function findById(int $userId, int $id): ?UserDataItem
    {
        return UserDataItem::whereHas('collection', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })->find($id);
    }

    /**
     * Find items by key.
     */
    public function findByKey(int $collectionId, string $key): Collection
    {
        return UserDataItem::where('collection_id', $collectionId)
            ->byKey($key)
            ->get();
    }

    /**
     * Find items by data type.
     */
    public function findByDataType(int $collectionId, string $dataType): Collection
    {
        return UserDataItem::where('collection_id', $collectionId)
            ->byDataType($dataType)
            ->get();
    }

    /**
     * Find items by tag.
     */
    public function findByTag(int $collectionId, string $tag): Collection
    {
        return UserDataItem::where('collection_id', $collectionId)
            ->byTag($tag)
            ->get();
    }

    /**
     * Create a new item.
     */
    public function create(array $data): UserDataItem
    {
        $item = new UserDataItem();
        $item->fill($data);
        
        // Handle value setting
        if (isset($data['value'])) {
            $item->setValue($data['value']);
        }
        
        $item->save();
        
        // Update collection item count
        $this->updateCollectionItemCount($item->collection_id);
        
        return $item;
    }

    /**
     * Create multiple items.
     */
    public function createMany(int $collectionId, array $items): array
    {
        $createdItems = [];
        
        foreach ($items as $index => $itemData) {
            $itemData['collection_id'] = $collectionId;
            $itemData['order'] = $itemData['order'] ?? $index;
            $createdItems[] = $this->create($itemData);
        }
        
        return $createdItems;
    }

    /**
     * Update an item.
     */
    public function update(int $userId, int $id, array $data): ?UserDataItem
    {
        $item = $this->findById($userId, $id);
        
        if (!$item) {
            return null;
        }

        $item->fill($data);
        
        // Handle value setting
        if (isset($data['value'])) {
            $item->setValue($data['value']);
        }
        
        $item->save();
        
        return $item;
    }

    /**
     * Delete an item.
     */
    public function delete(int $userId, int $id): bool
    {
        $item = $this->findById($userId, $id);
        
        if (!$item) {
            return false;
        }

        $collectionId = $item->collection_id;
        $deleted = $item->delete();
        
        if ($deleted) {
            $this->updateCollectionItemCount($collectionId);
        }
        
        return $deleted;
    }

    /**
     * Delete multiple items.
     */
    public function deleteMany(int $collectionId, array $itemIds): int
    {
        $deleted = UserDataItem::where('collection_id', $collectionId)
            ->whereIn('id', $itemIds)
            ->delete();
        
        if ($deleted > 0) {
            $this->updateCollectionItemCount($collectionId);
        }
        
        return $deleted;
    }

    /**
     * Get item statistics for a collection.
     */
    public function getStatistics(int $collectionId): array
    {
        $items = UserDataItem::where('collection_id', $collectionId)->get();

        return [
            'total' => $items->count(),
            'active' => $items->where('is_active', true)->count(),
            'by_type' => $items->groupBy('data_type')->map(function ($group) {
                return $group->count();
            })->toArray(),
            'with_tags' => $items->filter(function ($item) {
                return !empty($item->tags);
            })->count(),
            'recent_count' => $items->where('last_used_at', '>=', now()->subDays(7))->count(),
        ];
    }

    /**
     * Search items.
     */
    public function search(int $collectionId, string $query, array $filters = []): Collection
    {
        $searchQuery = UserDataItem::where('collection_id', $collectionId)
            ->where(function ($q) use ($query) {
                $q->where('key', 'like', '%' . $query . '%')
                  ->orWhere('value', 'like', '%' . $query . '%')
                  ->orWhere('label', 'like', '%' . $query . '%')
                  ->orWhere('description', 'like', '%' . $query . '%');
            });

        $this->applyFilters($searchQuery, $filters);

        return $searchQuery->get();
    }

    /**
     * Reorder items.
     */
    public function reorder(int $collectionId, array $itemOrders): bool
    {
        return DB::transaction(function () use ($collectionId, $itemOrders) {
            foreach ($itemOrders as $itemId => $order) {
                UserDataItem::where('collection_id', $collectionId)
                    ->where('id', $itemId)
                    ->update(['order' => $order]);
            }
            return true;
        });
    }

    /**
     * Bulk update items.
     */
    public function bulkUpdate(int $collectionId, array $updates): int
    {
        $updated = 0;
        
        foreach ($updates as $itemId => $data) {
            $item = UserDataItem::where('collection_id', $collectionId)
                ->where('id', $itemId)
                ->first();
            
            if ($item) {
                $item->fill($data);
                if (isset($data['value'])) {
                    $item->setValue($data['value']);
                }
                $item->save();
                $updated++;
            }
        }
        
        return $updated;
    }

    /**
     * Get items formatted for workflow.
     */
    public function getForWorkflow(int $collectionId): array
    {
        $items = UserDataItem::where('collection_id', $collectionId)
            ->active()
            ->orderBy('order')
            ->get();

        return $items->map(function ($item) {
            return $item->toWorkflowFormat();
        })->toArray();
    }

    /**
     * Add tag to item.
     */
    public function addTag(int $id, string $tag): bool
    {
        $item = UserDataItem::find($id);
        
        if (!$item) {
            return false;
        }

        $item->addTag($tag);
        return true;
    }

    /**
     * Remove tag from item.
     */
    public function removeTag(int $id, string $tag): bool
    {
        $item = UserDataItem::find($id);
        
        if (!$item) {
            return false;
        }

        $item->removeTag($tag);
        return true;
    }

    /**
     * Get items by tags.
     */
    public function getByTags(int $collectionId, array $tags): Collection
    {
        $query = UserDataItem::where('collection_id', $collectionId);
        
        foreach ($tags as $tag) {
            $query->whereJsonContains('tags', $tag);
        }
        
        return $query->get();
    }

    /**
     * Apply filters to query.
     */
    protected function applyFilters($query, array $filters): void
    {
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['key'])) {
            $query->byKey($filters['key']);
        }

        if (isset($filters['data_type'])) {
            $query->byDataType($filters['data_type']);
        }

        if (isset($filters['tag'])) {
            $query->byTag($filters['tag']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('key', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('value', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('label', 'like', '%' . $filters['search'] . '%');
            });
        }
    }

    /**
     * Update collection item count.
     */
    protected function updateCollectionItemCount(int $collectionId): void
    {
        $collection = UserDataCollection::find($collectionId);
        if ($collection) {
            $collection->updateItemCount();
        }
    }
}

