<?php

namespace App\Repositories\Contracts;

use App\Models\UserDataCollection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface UserDataCollectionRepositoryInterface
{
    /**
     * Get all collections for a user with pagination.
     */
    public function getAll(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get all collections for a user without pagination.
     */
    public function getAllWithoutPagination(int $userId, array $filters = []): Collection;

    /**
     * Find a collection by ID.
     */
    public function findById(int $userId, int $id): ?UserDataCollection;

    /**
     * Find a collection by type.
     */
    public function findByType(int $userId, string $type): Collection;

    /**
     * Create a new collection.
     */
    public function create(array $data): UserDataCollection;

    /**
     * Update a collection.
     */
    public function update(int $userId, int $id, array $data): ?UserDataCollection;

    /**
     * Delete a collection.
     */
    public function delete(int $userId, int $id): bool;

    /**
     * Get collection statistics.
     */
    public function getStatistics(int $userId): array;

    /**
     * Get collections by type with statistics.
     */
    public function getByTypeWithStats(int $userId, string $type): array;

    /**
     * Search collections.
     */
    public function search(int $userId, string $query, array $filters = []): Collection;

    /**
     * Get most used collections.
     */
    public function getMostUsed(int $userId, int $limit = 10): Collection;

    /**
     * Get recent collections.
     */
    public function getRecent(int $userId, int $limit = 10): Collection;

    /**
     * Duplicate a collection.
     */
    public function duplicate(int $userId, int $id, ?string $newName = null): ?UserDataCollection;

    /**
     * Update item count for a collection.
     */
    public function updateItemCount(int $id): void;

    /**
     * Mark collection as used.
     */
    public function markAsUsed(int $id): void;

    /**
     * Get collections formatted for workflow.
     */
    public function getForWorkflow(int $userId, int $id): ?array;

    /**
     * Get collections by type for workflow.
     */
    public function getByTypeForWorkflow(int $userId, string $type): array;
}

