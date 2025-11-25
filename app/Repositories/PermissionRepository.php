<?php

namespace App\Repositories;

use App\Models\Permission;
use App\Repositories\Contracts\PermissionRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class PermissionRepository implements PermissionRepositoryInterface
{
    /**
     * Get all permissions with filters.
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Permission::withCount('roles');

        // Filters
        if (isset($filters['group']) && $filters['group']) {
            $query->where('group', $filters['group']);
        }

        if (isset($filters['search']) && $filters['search']) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'group';
        $sortOrder = $filters['sort_order'] ?? 'asc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Get all permissions grouped by group.
     */
    public function getAllGrouped(): SupportCollection
    {
        return Permission::orderBy('group')->orderBy('name')->get()->groupBy('group');
    }

    /**
     * Get unique groups.
     */
    public function getGroups(): SupportCollection
    {
        return Permission::distinct()->pluck('group')->filter()->sort()->values();
    }

    /**
     * Get a permission by ID.
     */
    public function findById(int $id): ?Permission
    {
        return Permission::find($id);
    }

    /**
     * Get a permission by slug.
     */
    public function findBySlug(string $slug): ?Permission
    {
        return Permission::where('slug', $slug)->first();
    }

    /**
     * Create a new permission.
     */
    public function create(array $data): Permission
    {
        return Permission::create($data);
    }

    /**
     * Update a permission.
     */
    public function update(Permission $permission, array $data): bool
    {
        return $permission->update($data);
    }

    /**
     * Delete a permission.
     */
    public function delete(Permission $permission): bool
    {
        return $permission->delete();
    }

    /**
     * Check if permission is assigned to any role.
     */
    public function hasRoles(Permission $permission): bool
    {
        return $permission->roles()->count() > 0;
    }
}

