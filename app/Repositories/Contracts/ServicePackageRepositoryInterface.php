<?php

namespace App\Repositories\Contracts;

use App\Models\ServicePackage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ServicePackageRepositoryInterface
{
    /**
     * Get all service packages with filters.
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get active service packages.
     */
    public function getActive(array $filters = []): Collection;

    /**
     * Get a service package by ID.
     */
    public function findById(int $id): ?ServicePackage;

    /**
     * Create a new service package.
     */
    public function create(array $data): ServicePackage;

    /**
     * Update a service package.
     */
    public function update(ServicePackage $package, array $data): bool;

    /**
     * Delete a service package.
     */
    public function delete(ServicePackage $package): bool;

    /**
     * Check if package has active user packages.
     */
    public function hasActiveUserPackages(ServicePackage $package): bool;
}

