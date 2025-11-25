<?php

namespace App\Repositories;

use App\Models\UserDataCollection;
use App\Repositories\Contracts\UserDataCollectionRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class UserDataCollectionRepository implements UserDataCollectionRepositoryInterface
{
    /**
     * Get all collections for a user with pagination.
     */
    public function getAll(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = UserDataCollection::where('user_id', $userId);

        // Apply filters
        $this->applyFilters($query, $filters);

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'updated_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Eager load relationships
        $query->with('items');

        return $query->paginate($perPage);
    }

    /**
     * Get all collections for a user without pagination.
     */
    public function getAllWithoutPagination(int $userId, array $filters = []): Collection
    {
        $query = UserDataCollection::where('user_id', $userId);

        // Apply filters
        $this->applyFilters($query, $filters);

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'updated_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Eager load relationships
        $query->with('items');

        return $query->get();
    }

    /**
     * Find a collection by ID.
     */
    public function findById(int $userId, int $id): ?UserDataCollection
    {
        return UserDataCollection::where('user_id', $userId)
            ->with('activeItems')
            ->find($id);
    }

    /**
     * Find a collection by type.
     */
    public function findByType(int $userId, string $type): Collection
    {
        return UserDataCollection::where('user_id', $userId)
            ->ofType($type)
            ->active()
            ->with('activeItems')
            ->get();
    }

    /**
     * Create a new collection.
     */
    public function create(array $data): UserDataCollection
    {
        return UserDataCollection::create($data);
    }

    /**
     * Update a collection.
     */
    public function update(int $userId, int $id, array $data): ?UserDataCollection
    {
        $collection = UserDataCollection::where('user_id', $userId)->find($id);
        
        if (!$collection) {
            return null;
        }

        $collection->update($data);
        return $collection->fresh('items');
    }

    /**
     * Delete a collection.
     */
    public function delete(int $userId, int $id): bool
    {
        $collection = UserDataCollection::where('user_id', $userId)->find($id);
        
        if (!$collection) {
            return false;
        }

        return $collection->delete();
    }

    /**
     * Get collection statistics.
     */
    public function getStatistics(int $userId): array
    {
        $collections = UserDataCollection::where('user_id', $userId)->get();

        return [
            'total' => $collections->count(),
            'active' => $collections->where('is_active', true)->count(),
            'public' => $collections->where('is_public', true)->count(),
            'total_items' => $collections->sum('item_count'),
            'by_type' => $collections->groupBy('type')->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'total_items' => $group->sum('item_count'),
                ];
            })->toArray(),
            'recent_count' => $collections->where('last_used_at', '>=', now()->subDays(7))->count(),
        ];
    }

    /**
     * Get collections by type with statistics.
     */
    public function getByTypeWithStats(int $userId, string $type): array
    {
        $collections = $this->findByType($userId, $type);

        return [
            'collections' => $collections,
            'stats' => [
                'count' => $collections->count(),
                'total_items' => $collections->sum('item_count'),
                'avg_items' => $collections->count() > 0 ? round($collections->sum('item_count') / $collections->count(), 2) : 0,
            ],
        ];
    }

    /**
     * Search collections.
     */
    public function search(int $userId, string $query, array $filters = []): Collection
    {
        $searchQuery = UserDataCollection::where('user_id', $userId)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', '%' . $query . '%')
                  ->orWhere('description', 'like', '%' . $query . '%')
                  ->orWhere('type', 'like', '%' . $query . '%');
            });

        $this->applyFilters($searchQuery, $filters);

        return $searchQuery->with('items')->get();
    }

    /**
     * Get most used collections.
     */
    public function getMostUsed(int $userId, int $limit = 10): Collection
    {
        return UserDataCollection::where('user_id', $userId)
            ->whereNotNull('last_used_at')
            ->orderBy('last_used_at', 'desc')
            ->limit($limit)
            ->with('items')
            ->get();
    }

    /**
     * Get recent collections.
     */
    public function getRecent(int $userId, int $limit = 10): Collection
    {
        return UserDataCollection::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->with('items')
            ->get();
    }

    /**
     * Duplicate a collection.
     */
    public function duplicate(int $userId, int $id, ?string $newName = null): ?UserDataCollection
    {
        $original = UserDataCollection::where('user_id', $userId)->find($id);
        
        if (!$original) {
            return null;
        }

        return DB::transaction(function () use ($userId, $original, $newName) {
            $newCollection = $original->replicate();
            $newCollection->user_id = $userId;
            $newCollection->name = $newName ?? $original->name . ' (Copy)';
            $newCollection->item_count = 0;
            $newCollection->last_used_at = null;
            $newCollection->save();

            // Duplicate items
            foreach ($original->items as $item) {
                $newItem = $item->replicate();
                $newItem->collection_id = $newCollection->id;
                $newItem->last_used_at = null;
                $newItem->save();
            }

            $newCollection->updateItemCount();
            return $newCollection->load('items');
        });
    }

    /**
     * Update item count for a collection.
     */
    public function updateItemCount(int $id): void
    {
        $collection = UserDataCollection::find($id);
        if ($collection) {
            $collection->updateItemCount();
        }
    }

    /**
     * Mark collection as used.
     */
    public function markAsUsed(int $id): void
    {
        $collection = UserDataCollection::find($id);
        if ($collection) {
            $collection->markAsUsed();
        }
    }

    /**
     * Get collection formatted for workflow.
     */
    public function getForWorkflow(int $userId, int $id): ?array
    {
        $collection = $this->findById($userId, $id);
        
        if (!$collection) {
            return null;
        }

        $collection->markAsUsed();
        return $collection->toWorkflowFormat();
    }

    /**
     * Get collections by type for workflow.
     */
    public function getByTypeForWorkflow(int $userId, string $type): array
    {
        $collections = $this->findByType($userId, $type);

        return $collections->map(function ($collection) {
            $collection->markAsUsed();
            return $collection->toWorkflowFormat();
        })->toArray();
    }

    /**
     * Apply filters to query.
     */
    protected function applyFilters($query, array $filters): void
    {
        if (isset($filters['type'])) {
            $query->ofType($filters['type']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['is_public'])) {
            $query->where('is_public', $filters['is_public']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('description', 'like', '%' . $filters['search'] . '%');
            });
        }
    }
}

