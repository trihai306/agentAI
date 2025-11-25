<?php

namespace App\Repositories\Contracts;

use App\Models\Transaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface TransactionRepositoryInterface
{
    /**
     * Get all transactions with filters (for admin).
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get transactions for a specific user with filters.
     */
    public function getUserTransactions(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get a transaction by ID.
     */
    public function findById(int $id): ?Transaction;

    /**
     * Get a transaction by ID for a specific user.
     */
    public function getUserTransaction(int $userId, int $transactionId): ?Transaction;

    /**
     * Create a new transaction.
     */
    public function create(array $data): Transaction;

    /**
     * Update a transaction.
     */
    public function update(Transaction $transaction, array $data): bool;

    /**
     * Delete a transaction.
     */
    public function delete(Transaction $transaction): bool;

    /**
     * Get transaction statistics (for admin).
     */
    public function getStats(): array;

    /**
     * Get transaction statistics for a user.
     */
    public function getUserTransactionStats(int $userId): array;

    /**
     * Get recent transactions for a user.
     */
    public function getRecentTransactions(int $userId, int $limit = 10): Collection;

    /**
     * Get pending withdrawals.
     */
    public function getPendingWithdrawals(array $filters = [], int $perPage = 15): LengthAwarePaginator;
}

