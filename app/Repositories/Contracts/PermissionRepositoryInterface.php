<?php

namespace App\Repositories\Contracts;

use App\Models\Permission;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

interface PermissionRepositoryInterface
{
    /**
     * Get all permissions with filters.
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get all permissions grouped by group.
     */
    public function getAllGrouped(): SupportCollection;

    /**
     * Get unique groups.
     */
    public function getGroups(): SupportCollection;

    /**
     * Get a permission by ID.
     */
    public function findById(int $id): ?Permission;

    /**
     * Get a permission by slug.
     */
    public function findBySlug(string $slug): ?Permission;

    /**
     * Create a new permission.
     */
    public function create(array $data): Permission;

    /**
     * Update a permission.
     */
    public function update(Permission $permission, array $data): bool;

    /**
     * Delete a permission.
     */
    public function delete(Permission $permission): bool;

    /**
     * Check if permission is assigned to any role.
     */
    public function hasRoles(Permission $permission): bool;
}

