<?php

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class UserRepository implements UserRepositoryInterface
{
    /**
     * Get all users with filters.
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = User::query();

        // Search
        if (isset($filters['search']) && $filters['search']) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by email verified
        if (isset($filters['verified']) && $filters['verified'] !== '') {
            if ($filters['verified']) {
                $query->whereNotNull('email_verified_at');
            } else {
                $query->whereNull('email_verified_at');
            }
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';

        // Handle sorting for wallet balance
        if ($sortBy === 'wallet_balance') {
            $query->leftJoin('wallets', 'users.id', '=', 'wallets.user_id')
                  ->select('users.*')
                  ->orderBy('wallets.balance', $sortOrder);
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        return $query->with(['roles.permissions', 'wallet', 'transactions'])->paginate($perPage)->withQueryString();
    }

    /**
     * Get a user by ID.
     */
    public function findById(int $id): ?User
    {
        return User::with(['roles.permissions', 'wallet', 'transactions'])->find($id);
    }

    /**
     * Get a user by email.
     */
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    /**
     * Create a new user.
     */
    public function create(array $data): User
    {
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        return User::create($data);
    }

    /**
     * Update a user.
     */
    public function update(User $user, array $data): bool
    {
        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        return $user->update($data);
    }

    /**
     * Delete a user.
     */
    public function delete(User $user): bool
    {
        return $user->delete();
    }

    /**
     * Get user statistics.
     */
    public function getStats(): array
    {
        return [
            'total' => User::count(),
            'verified' => User::whereNotNull('email_verified_at')->count(),
            'unverified' => User::whereNull('email_verified_at')->count(),
            'recent' => User::where('created_at', '>=', now()->subDays(7))->count(),
            'active' => User::where('updated_at', '>=', now()->subDays(30))->count(),
        ];
    }

    /**
     * Assign roles to user.
     */
    public function assignRoles(User $user, array $roleIds): bool
    {
        $user->roles()->sync($roleIds);
        return true;
    }

    /**
     * Get user with roles and permissions.
     */
    public function getWithRoles(int $id): ?User
    {
        return User::with(['roles.permissions'])->find($id);
    }
}

