<?php

namespace App\Repositories;

use App\Models\ServicePackage;
use App\Repositories\Contracts\ServicePackageRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ServicePackageRepository implements ServicePackageRepositoryInterface
{
    /**
     * Get all service packages with filters.
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = ServicePackage::query();

        // Filters
        if (isset($filters['type']) && $filters['type']) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['search']) && $filters['search']) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Get active service packages.
     */
    public function getActive(array $filters = []): Collection
    {
        $query = ServicePackage::active();

        // Filter by type
        if (isset($filters['type']) && $filters['type']) {
            $query->where('type', $filters['type']);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'price';
        $sortOrder = $filters['sort_order'] ?? 'asc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->get();
    }

    /**
     * Get a service package by ID.
     */
    public function findById(int $id): ?ServicePackage
    {
        return ServicePackage::find($id);
    }

    /**
     * Create a new service package.
     */
    public function create(array $data): ServicePackage
    {
        return ServicePackage::create($data);
    }

    /**
     * Update a service package.
     */
    public function update(ServicePackage $package, array $data): bool
    {
        return $package->update($data);
    }

    /**
     * Delete a service package.
     */
    public function delete(ServicePackage $package): bool
    {
        return $package->delete();
    }

    /**
     * Check if package has active user packages.
     */
    public function hasActiveUserPackages(ServicePackage $package): bool
    {
        return $package->userPackages()->where('status', 'active')->exists();
    }
}

