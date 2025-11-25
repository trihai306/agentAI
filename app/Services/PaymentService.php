<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\Wallet;
use App\Models\ServicePackage;
use App\Models\UserPackage;
use App\Models\WithdrawalSetting;
use App\Services\WalletService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PaymentService
{
    protected WalletService $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * Process deposit transaction.
     */
    public function processDeposit(int $userId, float $amount, string $paymentMethod, array $paymentInfo = [], ?string $description = null): Transaction
    {
        $transaction = $this->walletService->createTransaction([
            'user_id' => $userId,
            'type' => 'deposit',
            'amount' => $amount,
            'currency' => 'VND',
            'status' => 'pending',
            'payment_method' => $paymentMethod,
            'payment_info' => $paymentInfo,
            'description' => $description ?? 'Nạp tiền vào ví',
        ]);

        return $transaction;
    }

    /**
     * Approve deposit and add balance to wallet.
     */
    public function approveDeposit(Transaction $transaction, int $approvedBy): bool
    {
        try {
            DB::beginTransaction();

            if ($transaction->status !== 'pending' || $transaction->type !== 'deposit') {
                DB::rollBack();
                return false;
            }

            // Add balance to wallet
            $this->walletService->addBalance($transaction->user_id, $transaction->amount);

            // Mark transaction as completed
            $transaction->markAsCompleted($approvedBy);

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to approve deposit: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Process withdrawal transaction with smart approval.
     */
    public function processWithdrawal(int $userId, float $amount, array $paymentInfo, ?string $description = null): array
    {
        $settings = WithdrawalSetting::getSettings();

        // Validate amount
        $errors = $settings->validateAmount($amount);
        if (!empty($errors)) {
            return ['success' => false, 'errors' => $errors];
        }

        // Check balance
        if (!$this->walletService->checkBalance($userId, $amount)) {
            return ['success' => false, 'errors' => ['Số dư không đủ']];
        }

        // Calculate fee
        $fee = $settings->calculateFee($amount);
        $totalAmount = $amount + $fee;

        // Check balance after fee
        if (!$this->walletService->checkBalance($userId, $totalAmount)) {
            return ['success' => false, 'errors' => ['Số dư không đủ để thanh toán phí']];
        }

        try {
            DB::beginTransaction();

            // Create transaction
            $transaction = $this->walletService->createTransaction([
                'user_id' => $userId,
                'type' => 'withdrawal',
                'amount' => $amount,
                'currency' => 'VND',
                'status' => 'pending',
                'payment_method' => 'bank_transfer',
                'payment_info' => $paymentInfo,
                'description' => $description ?? 'Rút tiền từ ví',
                'metadata' => ['fee' => $fee, 'total_amount' => $totalAmount],
            ]);

            // Deduct balance (including fee)
            $this->walletService->deductBalance($userId, $totalAmount);

            // Auto-approve if amount is within threshold
            if ($settings->canAutoApprove($amount)) {
                $transaction->markAsCompleted();
                DB::commit();
                return ['success' => true, 'transaction' => $transaction, 'auto_approved' => true];
            }

            // Otherwise, keep as pending for admin approval
            DB::commit();
            return ['success' => true, 'transaction' => $transaction, 'auto_approved' => false];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to process withdrawal: ' . $e->getMessage());
            return ['success' => false, 'errors' => ['Có lỗi xảy ra khi xử lý yêu cầu rút tiền']];
        }
    }

    /**
     * Approve withdrawal transaction.
     */
    public function approveWithdrawal(Transaction $transaction, int $approvedBy): bool
    {
        try {
            DB::beginTransaction();

            if ($transaction->status !== 'pending' || $transaction->type !== 'withdrawal') {
                DB::rollBack();
                return false;
            }

            // Balance already deducted, just mark as completed
            $transaction->markAsCompleted($approvedBy);

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to approve withdrawal: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Reject withdrawal and refund balance.
     */
    public function rejectWithdrawal(Transaction $transaction, int $rejectedBy, ?string $reason = null): bool
    {
        try {
            DB::beginTransaction();

            if ($transaction->status !== 'pending' || $transaction->type !== 'withdrawal') {
                DB::rollBack();
                return false;
            }

            // Refund balance (amount + fee)
            $metadata = $transaction->metadata ?? [];
            $totalAmount = $metadata['total_amount'] ?? $transaction->amount;
            $this->walletService->addBalance($transaction->user_id, $totalAmount);

            // Mark as cancelled
            $transaction->markAsCancelled();
            if ($reason) {
                $transaction->description = ($transaction->description ?? '') . ' - Lý do từ chối: ' . $reason;
                $transaction->save();
            }

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to reject withdrawal: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Process purchase of service package.
     */
    public function processPurchase(int $userId, int $packageId): array
    {
        $package = ServicePackage::findOrFail($packageId);

        if (!$package->is_active) {
            return ['success' => false, 'errors' => ['Gói dịch vụ không khả dụng']];
        }

        // Check balance
        if (!$this->walletService->checkBalance($userId, $package->price)) {
            return ['success' => false, 'errors' => ['Số dư không đủ']];
        }

        try {
            DB::beginTransaction();

            // Deduct balance
            $this->walletService->deductBalance($userId, $package->price);

            // Create transaction
            $transaction = $this->walletService->createTransaction([
                'user_id' => $userId,
                'type' => 'purchase',
                'amount' => $package->price,
                'currency' => 'VND',
                'status' => 'completed',
                'payment_method' => 'wallet',
                'description' => "Mua gói dịch vụ: {$package->name}",
                'metadata' => ['package_id' => $packageId],
            ]);

            // Create user package
            $expiresAt = $package->duration_days 
                ? Carbon::now()->addDays($package->duration_days)
                : null;

            $userPackage = UserPackage::create([
                'user_id' => $userId,
                'package_id' => $packageId,
                'quota_total' => $package->quota,
                'quota_used' => 0,
                'expires_at' => $expiresAt,
                'status' => 'active',
                'purchased_at' => now(),
            ]);

            DB::commit();
            return ['success' => true, 'transaction' => $transaction, 'user_package' => $userPackage];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to process purchase: ' . $e->getMessage());
            return ['success' => false, 'errors' => ['Có lỗi xảy ra khi mua gói dịch vụ']];
        }
    }
}

