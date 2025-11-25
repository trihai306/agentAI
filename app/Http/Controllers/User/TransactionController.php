<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\UserTransactionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    protected UserTransactionService $transactionService;

    public function __construct(UserTransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    /**
     * Display a listing of the user's transactions.
     */
    public function index(Request $request): Response
    {
        $userId = auth()->id();
        $filters = $request->only(['search', 'type', 'status', 'payment_method', 'date_from', 'date_to', 'sort_by', 'sort_order', 'per_page']);
        
        $transactions = $this->transactionService->getUserTransactions(
            $userId,
            $filters,
            $request->get('per_page', 15)
        );

        $stats = $this->transactionService->getUserTransactionStats($userId);

        return Inertia::render('User/Transactions/Index', [
            'transactions' => $transactions,
            'stats' => $stats,
            'filters' => $filters,
        ]);
    }

    /**
     * Display the specified transaction.
     */
    public function show(int $id): Response
    {
        $userId = auth()->id();
        $transaction = $this->transactionService->getUserTransaction($userId, $id);

        if (!$transaction) {
            abort(404, 'Giao dịch không tồn tại hoặc không thuộc về bạn.');
        }

        return Inertia::render('User/Transactions/Show', [
            'transaction' => $transaction,
        ]);
    }

    /**
     * Export transactions.
     */
    public function export(Request $request)
    {
        $userId = auth()->id();
        $filters = $request->only(['type', 'status', 'payment_method', 'date_from', 'date_to']);
        
        $data = $this->transactionService->exportTransactions($userId, $filters);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}

