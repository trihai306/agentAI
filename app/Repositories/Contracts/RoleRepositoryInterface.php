<?php

namespace App\Repositories\Contracts;

use App\Models\Role;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface RoleRepositoryInterface
{
    /**
     * Get all roles with filters.
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get a role by ID.
     */
    public function findById(int $id): ?Role;

    /**
     * Get a role by slug.
     */
    public function findBySlug(string $slug): ?Role;

    /**
     * Create a new role.
     */
    public function create(array $data): Role;

    /**
     * Update a role.
     */
    public function update(Role $role, array $data): bool;

    /**
     * Delete a role.
     */
    public function delete(Role $role): bool;

    /**
     * Assign permissions to role.
     */
    public function assignPermissions(Role $role, array $permissionIds): bool;

    /**
     * Check if role has users.
     */
    public function hasUsers(Role $role): bool;
}

