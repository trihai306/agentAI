<?php

namespace App\Services;

use App\Repositories\Contracts\TransactionRepositoryInterface;
use App\Services\PaymentService;
use Illuminate\Support\Facades\Log;

class AdminTransactionService
{
    protected TransactionRepositoryInterface $transactionRepository;
    protected PaymentService $paymentService;

    public function __construct(
        TransactionRepositoryInterface $transactionRepository,
        PaymentService $paymentService
    ) {
        $this->transactionRepository = $transactionRepository;
        $this->paymentService = $paymentService;
    }

    /**
     * Get all transactions with filters.
     */
    public function getAllTransactions(array $filters = [], int $perPage = 15)
    {
        return $this->transactionRepository->getAll($filters, $perPage);
    }

    /**
     * Get a transaction by ID.
     */
    public function getTransaction(int $id)
    {
        return $this->transactionRepository->findById($id);
    }

    /**
     * Approve a transaction.
     */
    public function approveTransaction(int $id, int $approverId, ?string $reason = null): array
    {
        $transaction = $this->transactionRepository->findById($id);

        if (!$transaction) {
            return [
                'success' => false,
                'message' => 'Giao dịch không tồn tại.',
            ];
        }

        try {
            $success = false;

            if ($transaction->type === 'deposit') {
                $success = $this->paymentService->approveDeposit($transaction, $approverId);
            } elseif ($transaction->type === 'withdrawal') {
                $success = $this->paymentService->approveWithdrawal($transaction, $approverId);
            }

            if ($success) {
                return [
                    'success' => true,
                    'message' => 'Giao dịch đã được phê duyệt thành công.',
                ];
            }

            return [
                'success' => false,
                'message' => 'Không thể phê duyệt giao dịch này.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminTransactionService: Error approving transaction', [
                'transaction_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi phê duyệt giao dịch: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Reject a transaction.
     */
    public function rejectTransaction(int $id, int $approverId, string $reason): array
    {
        $transaction = $this->transactionRepository->findById($id);

        if (!$transaction) {
            return [
                'success' => false,
                'message' => 'Giao dịch không tồn tại.',
            ];
        }

        try {
            $success = false;

            if ($transaction->type === 'withdrawal') {
                $success = $this->paymentService->rejectWithdrawal($transaction, $approverId, $reason);
            } elseif ($transaction->type === 'deposit') {
                $transaction->markAsCancelled();
                $transaction->description = ($transaction->description ?? '') . ' - Lý do từ chối: ' . $reason;
                $this->transactionRepository->update($transaction, []);
                $success = true;
            }

            if ($success) {
                return [
                    'success' => true,
                    'message' => 'Giao dịch đã bị từ chối.',
                ];
            }

            return [
                'success' => false,
                'message' => 'Không thể từ chối giao dịch này.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminTransactionService: Error rejecting transaction', [
                'transaction_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi từ chối giao dịch: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get transaction statistics.
     */
    public function getStats(): array
    {
        return $this->transactionRepository->getStats();
    }

    /**
     * Get pending withdrawals.
     */
    public function getPendingWithdrawals(array $filters = [], int $perPage = 15)
    {
        return $this->transactionRepository->getPendingWithdrawals($filters, $perPage);
    }
}

