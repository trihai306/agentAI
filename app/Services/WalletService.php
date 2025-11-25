<?php

namespace App\Services;

use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\WithdrawalSetting;
use App\Repositories\Contracts\TransactionRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WalletService
{
    protected TransactionRepositoryInterface $transactionRepository;

    public function __construct(TransactionRepositoryInterface $transactionRepository)
    {
        $this->transactionRepository = $transactionRepository;
    }
    /**
     * Add balance to user's wallet.
     */
    public function addBalance(int $userId, float $amount, string $currency = 'VND'): bool
    {
        try {
            DB::beginTransaction();

            $wallet = Wallet::getOrCreateForUser($userId);
            $wallet->deposit($amount);

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to add balance: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Deduct balance from user's wallet.
     */
    public function deductBalance(int $userId, float $amount): bool
    {
        try {
            DB::beginTransaction();

            $wallet = Wallet::getOrCreateForUser($userId);
            
            if (!$wallet->canWithdraw($amount)) {
                DB::rollBack();
                return false;
            }

            $wallet->withdraw($amount);

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to deduct balance: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if user has sufficient balance.
     */
    public function checkBalance(int $userId, float $amount): bool
    {
        $wallet = Wallet::getOrCreateForUser($userId);
        return $wallet->canWithdraw($amount);
    }

    /**
     * Get user's wallet balance.
     */
    public function getBalance(int $userId): float
    {
        $wallet = Wallet::getOrCreateForUser($userId);
        return (float) $wallet->balance;
    }

    /**
     * Create a transaction with validation.
     */
    public function createTransaction(array $data): Transaction
    {
        $data['reference_code'] = Transaction::generateReferenceCode();
        
        return $this->transactionRepository->create($data);
    }

    /**
     * Get or create wallet for user.
     */
    public function getOrCreateWallet(int $userId): Wallet
    {
        return Wallet::getOrCreateForUser($userId);
    }

    /**
     * Get recent transactions for user.
     */
    public function getRecentTransactions(int $userId, int $limit = 10)
    {
        return $this->transactionRepository->getRecentTransactions($userId, $limit);
    }

    /**
     * Get transaction history for user.
     */
    public function getTransactionHistory(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->transactionRepository->getUserTransactions($userId, $filters, $perPage);
    }

    /**
     * Get withdrawal settings.
     */
    public function getWithdrawalSettings(): WithdrawalSetting
    {
        return WithdrawalSetting::getSettings();
    }
}

