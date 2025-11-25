<?php

namespace App\Repositories\Contracts;

use App\Models\UserDataItem;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface UserDataItemRepositoryInterface
{
    /**
     * Get all items for a collection with pagination.
     */
    public function getAll(int $collectionId, array $filters = [], int $perPage = 50): LengthAwarePaginator;

    /**
     * Get all items for a collection without pagination.
     */
    public function getAllWithoutPagination(int $collectionId, array $filters = []): Collection;

    /**
     * Find an item by ID.
     */
    public function findById(int $userId, int $id): ?UserDataItem;

    /**
     * Find items by key.
     */
    public function findByKey(int $collectionId, string $key): Collection;

    /**
     * Find items by data type.
     */
    public function findByDataType(int $collectionId, string $dataType): Collection;

    /**
     * Find items by tag.
     */
    public function findByTag(int $collectionId, string $tag): Collection;

    /**
     * Create a new item.
     */
    public function create(array $data): UserDataItem;

    /**
     * Create multiple items.
     */
    public function createMany(int $collectionId, array $items): array;

    /**
     * Update an item.
     */
    public function update(int $userId, int $id, array $data): ?UserDataItem;

    /**
     * Delete an item.
     */
    public function delete(int $userId, int $id): bool;

    /**
     * Delete multiple items.
     */
    public function deleteMany(int $collectionId, array $itemIds): int;

    /**
     * Get item statistics for a collection.
     */
    public function getStatistics(int $collectionId): array;

    /**
     * Search items.
     */
    public function search(int $collectionId, string $query, array $filters = []): Collection;

    /**
     * Reorder items.
     */
    public function reorder(int $collectionId, array $itemOrders): bool;

    /**
     * Bulk update items.
     */
    public function bulkUpdate(int $collectionId, array $updates): int;

    /**
     * Get items formatted for workflow.
     */
    public function getForWorkflow(int $collectionId): array;

    /**
     * Add tag to item.
     */
    public function addTag(int $id, string $tag): bool;

    /**
     * Remove tag from item.
     */
    public function removeTag(int $id, string $tag): bool;

    /**
     * Get items by tags.
     */
    public function getByTags(int $collectionId, array $tags): Collection;
}

