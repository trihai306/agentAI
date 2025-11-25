<?php

namespace App\Services;

use App\Repositories\TransactionRepository;
use Illuminate\Support\Facades\Log;

class UserTransactionService
{
    protected TransactionRepository $transactionRepository;

    public function __construct(TransactionRepository $transactionRepository)
    {
        $this->transactionRepository = $transactionRepository;
    }

    /**
     * Get user transactions with filters.
     */
    public function getUserTransactions(int $userId, array $filters = [], int $perPage = 15)
    {
        return $this->transactionRepository->getUserTransactions($userId, $filters, $perPage);
    }

    /**
     * Get a specific transaction for a user.
     */
    public function getUserTransaction(int $userId, int $transactionId)
    {
        return $this->transactionRepository->getUserTransaction($userId, $transactionId);
    }

    /**
     * Get transaction statistics for a user.
     */
    public function getUserTransactionStats(int $userId): array
    {
        return $this->transactionRepository->getUserTransactionStats($userId);
    }

    /**
     * Get recent transactions for a user.
     */
    public function getRecentTransactions(int $userId, int $limit = 10)
    {
        return $this->transactionRepository->getRecentTransactions($userId, $limit);
    }

    /**
     * Export user transactions to array format.
     */
    public function exportTransactions(int $userId, array $filters = []): array
    {
        $transactions = $this->transactionRepository->getUserTransactions($userId, $filters, 1000);
        
        return $transactions->map(function ($transaction) {
            return [
                'id' => $transaction->id,
                'reference_code' => $transaction->reference_code,
                'type' => $transaction->type,
                'amount' => $transaction->amount,
                'currency' => $transaction->currency,
                'status' => $transaction->status,
                'payment_method' => $transaction->payment_method,
                'description' => $transaction->description,
                'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $transaction->updated_at->format('Y-m-d H:i:s'),
            ];
        })->toArray();
    }
}

