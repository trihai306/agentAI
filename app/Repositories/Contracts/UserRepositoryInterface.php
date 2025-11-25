<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface UserRepositoryInterface
{
    /**
     * Get all users with filters.
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get a user by ID.
     */
    public function findById(int $id): ?User;

    /**
     * Get a user by email.
     */
    public function findByEmail(string $email): ?User;

    /**
     * Create a new user.
     */
    public function create(array $data): User;

    /**
     * Update a user.
     */
    public function update(User $user, array $data): bool;

    /**
     * Delete a user.
     */
    public function delete(User $user): bool;

    /**
     * Get user statistics.
     */
    public function getStats(): array;

    /**
     * Assign roles to user.
     */
    public function assignRoles(User $user, array $roleIds): bool;

    /**
     * Get users with roles and permissions.
     */
    public function getWithRoles(int $id): ?User;
}

