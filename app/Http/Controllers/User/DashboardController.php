<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\UserDeviceService;
use App\Services\UserTransactionService;
use App\Services\WalletService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    protected UserDeviceService $deviceService;
    protected UserTransactionService $transactionService;
    protected WalletService $walletService;

    public function __construct(
        UserDeviceService $deviceService,
        UserTransactionService $transactionService,
        WalletService $walletService
    ) {
        $this->deviceService = $deviceService;
        $this->transactionService = $transactionService;
        $this->walletService = $walletService;
    }

    /**
     * Display user dashboard.
     */
    public function index(): Response
    {
        $userId = Auth::id();

        // Get statistics
        $deviceStats = $this->deviceService->getUserDeviceStats($userId);
        $transactionStats = $this->transactionService->getUserTransactionStats($userId);
        $walletBalance = $this->walletService->getBalance($userId);
        $recentTransactions = $this->transactionService->getRecentTransactions($userId, 5);

        return Inertia::render('User/Dashboard', [
            'deviceStats' => $deviceStats,
            'transactionStats' => $transactionStats,
            'walletBalance' => $walletBalance,
            'recentTransactions' => $recentTransactions,
        ]);
    }
}

