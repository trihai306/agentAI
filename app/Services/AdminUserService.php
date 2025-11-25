<?php

namespace App\Services;

use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AdminUserService
{
    protected UserRepositoryInterface $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    /**
     * Get all users with filters.
     */
    public function getAllUsers(array $filters = [], int $perPage = 15)
    {
        $users = $this->userRepository->getAll($filters, $perPage);

        // Calculate financial statistics for each user
        $users->getCollection()->transform(function ($user) {
            $wallet = $user->wallet;
            $transactions = $user->transactions;

            // Calculate totals from completed transactions only
            $totalDeposit = $transactions->where('type', 'deposit')
                ->where('status', 'completed')
                ->sum('amount');

            $totalWithdrawal = $transactions->where('type', 'withdrawal')
                ->where('status', 'completed')
                ->sum('amount');

            $totalSpent = $transactions->where('type', 'purchase')
                ->where('status', 'completed')
                ->sum('amount');

            // Add financial data to user object
            $user->wallet_balance = $wallet ? (float) $wallet->balance : 0;
            $user->total_deposit = (float) $totalDeposit;
            $user->total_withdrawal = (float) $totalWithdrawal;
            $user->total_spent = (float) $totalSpent;

            return $user;
        });

        // Re-sort if needed for transaction total columns (after calculating)
        if (isset($filters['sort_by']) && in_array($filters['sort_by'], ['total_deposit', 'total_withdrawal', 'total_spent'])) {
            $sorted = $users->getCollection()->sortBy(
                $filters['sort_by'],
                SORT_REGULAR,
                ($filters['sort_order'] ?? 'desc') === 'desc'
            );
            $users->setCollection($sorted->values());
        }

        return $users;
    }

    /**
     * Get a user by ID.
     */
    public function getUser(int $id)
    {
        return $this->userRepository->findById($id);
    }

    /**
     * Create a new user.
     */
    public function createUser(array $data): array
    {
        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,id',
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'errors' => $validator->errors(),
            ];
        }

        try {
            $validated = $validator->validated();
            $roles = $validated['roles'] ?? [];
            unset($validated['roles']);

            $user = $this->userRepository->create($validated);

            if (!empty($roles)) {
                $this->userRepository->assignRoles($user, $roles);
            }

            return [
                'success' => true,
                'user' => $user,
                'message' => 'Người dùng đã được tạo thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminUserService: Error creating user', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi tạo người dùng: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update a user.
     */
    public function updateUser(int $id, array $data): array
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            return [
                'success' => false,
                'message' => 'Người dùng không tồn tại.',
            ];
        }

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'password' => 'nullable|string|min:8',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,id',
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'errors' => $validator->errors(),
            ];
        }

        try {
            $validated = $validator->validated();
            $roles = $validated['roles'] ?? null;
            unset($validated['roles']);

            $this->userRepository->update($user, $validated);

            if ($roles !== null) {
                $this->userRepository->assignRoles($user, $roles);
            }

            return [
                'success' => true,
                'user' => $user->fresh(),
                'message' => 'Thông tin người dùng đã được cập nhật.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminUserService: Error updating user', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi cập nhật người dùng: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Delete a user.
     */
    public function deleteUser(int $id, int $currentUserId): array
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            return [
                'success' => false,
                'message' => 'Người dùng không tồn tại.',
            ];
        }

        // Prevent deleting yourself
        if ($user->id === $currentUserId) {
            return [
                'success' => false,
                'message' => 'Bạn không thể xóa chính mình.',
            ];
        }

        try {
            $this->userRepository->delete($user);

            return [
                'success' => true,
                'message' => 'Người dùng đã được xóa thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminUserService: Error deleting user', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi xóa người dùng: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get user statistics.
     */
    public function getStats(): array
    {
        return $this->userRepository->getStats();
    }

    /**
     * Verify user email.
     */
    public function verifyEmail(int $id): array
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            return [
                'success' => false,
                'message' => 'Người dùng không tồn tại.',
            ];
        }

        $this->userRepository->update($user, ['email_verified_at' => now()]);

        return [
            'success' => true,
            'message' => 'Email đã được xác thực.',
        ];
    }

    /**
     * Unverify user email.
     */
    public function unverifyEmail(int $id): array
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            return [
                'success' => false,
                'message' => 'Người dùng không tồn tại.',
            ];
        }

        $this->userRepository->update($user, ['email_verified_at' => null]);

        return [
            'success' => true,
            'message' => 'Email đã được bỏ xác thực.',
        ];
    }

    /**
     * Reset user password.
     */
    public function resetPassword(int $id, string $password): array
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            return [
                'success' => false,
                'message' => 'Người dùng không tồn tại.',
            ];
        }

        $this->userRepository->update($user, ['password' => $password]);

        return [
            'success' => true,
            'message' => 'Mật khẩu đã được đặt lại.',
        ];
    }
}

