<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use App\Models\WithdrawalSetting;
use App\Services\PaymentService;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WalletController extends Controller
{
    protected WalletService $walletService;
    protected PaymentService $paymentService;

    public function __construct(WalletService $walletService, PaymentService $paymentService)
    {
        $this->walletService = $walletService;
        $this->paymentService = $paymentService;
    }

    /**
     * Display wallet information and recent transactions.
     */
    public function show(): Response
    {
        $wallet = $this->walletService->getOrCreateWallet(auth()->id());
        $recentTransactions = $this->walletService->getRecentTransactions(auth()->id(), 10);

        return Inertia::render('Wallet/Index', [
            'wallet' => $wallet,
            'recentTransactions' => $recentTransactions,
        ]);
    }

    /**
     * Show deposit form.
     */
    public function deposit(): Response
    {
        return Inertia::render('Wallet/Deposit');
    }

    /**
     * Process deposit request.
     */
    public function processDeposit(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:10000', // Minimum 10k VND
            'payment_method' => 'required|in:bank_transfer,momo,zalopay,credit_card',
            'payment_info' => 'required|array',
            'description' => 'nullable|string|max:500',
        ]);

        $transaction = $this->paymentService->processDeposit(
            auth()->id(),
            $validated['amount'],
            $validated['payment_method'],
            $validated['payment_info'],
            $validated['description'] ?? null
        );

        return redirect()->route('wallet.show')
            ->with('success', 'Yêu cầu nạp tiền đã được tạo. Vui lòng chờ admin xác nhận.');
    }

    /**
     * Show withdrawal form.
     */
    public function withdraw(): Response
    {
        $wallet = $this->walletService->getOrCreateWallet(auth()->id());
        $settings = $this->walletService->getWithdrawalSettings();

        return Inertia::render('Wallet/Withdraw', [
            'wallet' => $wallet,
            'settings' => $settings,
        ]);
    }

    /**
     * Process withdrawal request.
     */
    public function processWithdraw(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:50000', // Minimum 50k VND
            'bank_account' => 'required|string|max:255',
            'bank_name' => 'required|string|max:255',
            'account_holder' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        $paymentInfo = [
            'bank_account' => $validated['bank_account'],
            'bank_name' => $validated['bank_name'],
            'account_holder' => $validated['account_holder'],
        ];

        $result = $this->paymentService->processWithdrawal(
            auth()->id(),
            $validated['amount'],
            $paymentInfo,
            $validated['description'] ?? null
        );

        if (!$result['success']) {
            return redirect()->back()
                ->withErrors($result['errors'] ?? ['Có lỗi xảy ra']);
        }

        $message = $result['auto_approved'] 
            ? 'Yêu cầu rút tiền đã được tự động phê duyệt.'
            : 'Yêu cầu rút tiền đã được gửi. Vui lòng chờ admin phê duyệt.';

        return redirect()->route('wallet.show')
            ->with('success', $message);
    }

    /**
     * Display transaction history.
     */
    public function history(Request $request): Response
    {
        $filters = $request->only(['type', 'status', 'date_from', 'date_to', 'sort_by', 'sort_order', 'per_page']);
        $perPage = $request->get('per_page', 15);

        $transactions = $this->walletService->getTransactionHistory(auth()->id(), $filters, $perPage);

        return Inertia::render('Wallet/History', [
            'transactions' => $transactions,
            'filters' => $filters,
        ]);
    }
}
