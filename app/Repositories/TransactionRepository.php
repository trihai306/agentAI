<?php

namespace App\Repositories;

use App\Models\Transaction;
use App\Repositories\Contracts\TransactionRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class TransactionRepository implements TransactionRepositoryInterface
{
    /**
     * Get all transactions with filters (for admin).
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Transaction::with(['user', 'approver']);

        // Filters
        if (isset($filters['type']) && $filters['type']) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['status']) && $filters['status']) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['payment_method']) && $filters['payment_method']) {
            $query->where('payment_method', $filters['payment_method']);
        }

        if (isset($filters['date_from']) && $filters['date_from']) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to']) && $filters['date_to']) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (isset($filters['search']) && $filters['search']) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('reference_code', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage)->withQueryString();
    }
    /**
     * Get transactions for a specific user with filters.
     */
    public function getUserTransactions(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Transaction::where('user_id', $userId);

        // Filter by type
        if (isset($filters['type']) && $filters['type']) {
            $query->where('type', $filters['type']);
        }

        // Filter by status
        if (isset($filters['status']) && $filters['status']) {
            $query->where('status', $filters['status']);
        }

        // Filter by payment method
        if (isset($filters['payment_method']) && $filters['payment_method']) {
            $query->where('payment_method', $filters['payment_method']);
        }

        // Filter by date range
        if (isset($filters['date_from']) && $filters['date_from']) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to']) && $filters['date_to']) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        // Search
        if (isset($filters['search']) && $filters['search']) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('reference_code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Get a transaction by ID for a specific user.
     */
    public function getUserTransaction(int $userId, int $transactionId): ?Transaction
    {
        return Transaction::where('user_id', $userId)
            ->where('id', $transactionId)
            ->first();
    }

    /**
     * Get transaction statistics for a user.
     */
    public function getUserTransactionStats(int $userId): array
    {
        $total = Transaction::where('user_id', $userId)->count();
        $totalDeposit = Transaction::where('user_id', $userId)
            ->where('type', 'deposit')
            ->where('status', 'completed')
            ->sum('amount');
        $totalWithdrawal = Transaction::where('user_id', $userId)
            ->where('type', 'withdrawal')
            ->where('status', 'completed')
            ->sum('amount');
        $totalSpent = Transaction::where('user_id', $userId)
            ->where('type', 'purchase')
            ->where('status', 'completed')
            ->sum('amount');
        $pending = Transaction::where('user_id', $userId)
            ->where('status', 'pending')
            ->count();
        $completed = Transaction::where('user_id', $userId)
            ->where('status', 'completed')
            ->count();

        return [
            'total' => $total,
            'total_deposit' => (float) $totalDeposit,
            'total_withdrawal' => (float) $totalWithdrawal,
            'total_spent' => (float) $totalSpent,
            'pending' => $pending,
            'completed' => $completed,
        ];
    }

    /**
     * Get recent transactions for a user.
     */
    public function getRecentTransactions(int $userId, int $limit = 10): Collection
    {
        return Transaction::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get a transaction by ID.
     */
    public function findById(int $id): ?Transaction
    {
        return Transaction::with(['user', 'approver'])->find($id);
    }

    /**
     * Create a new transaction.
     */
    public function create(array $data): Transaction
    {
        return Transaction::create($data);
    }

    /**
     * Update a transaction.
     */
    public function update(Transaction $transaction, array $data): bool
    {
        return $transaction->update($data);
    }

    /**
     * Delete a transaction.
     */
    public function delete(Transaction $transaction): bool
    {
        return $transaction->delete();
    }

    /**
     * Get transaction statistics (for admin).
     */
    public function getStats(): array
    {
        return [
            'total_deposits' => Transaction::deposits()->completed()->sum('amount'),
            'total_withdrawals' => Transaction::withdrawals()->completed()->sum('amount'),
            'pending_withdrawals' => Transaction::withdrawals()->pending()->count(),
            'pending_deposits' => Transaction::deposits()->pending()->count(),
            'total_transactions' => Transaction::count(),
            'completed_transactions' => Transaction::completed()->count(),
        ];
    }

    /**
     * Get pending withdrawals.
     */
    public function getPendingWithdrawals(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Transaction::withdrawals()
            ->with(['user'])
            ->where('status', 'pending');

        if (isset($filters['date_from']) && $filters['date_from']) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to']) && $filters['date_to']) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (isset($filters['search']) && $filters['search']) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('reference_code', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage)->withQueryString();
    }
}

