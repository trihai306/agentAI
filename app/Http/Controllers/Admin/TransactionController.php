<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminTransactionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    protected AdminTransactionService $transactionService;

    public function __construct(AdminTransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    /**
     * Display a listing of transactions.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['type', 'status', 'payment_method', 'date_from', 'date_to', 'search', 'sort_by', 'sort_order', 'per_page']);
        $perPage = $request->get('per_page', 15);

        $transactions = $this->transactionService->getAllTransactions($filters, $perPage);
        $stats = $this->transactionService->getStats();

        // Load user with roles and permissions for permission checking
        $authUser = auth()->user();
        if ($authUser) {
            $authUser->load(['roles.permissions']);
        }

        return Inertia::render('Admin/Transactions/Index', [
            'transactions' => $transactions,
            'stats' => $stats,
            'auth' => [
                'user' => $authUser,
            ],
            'filters' => $filters,
        ]);
    }

    /**
     * Display the specified transaction.
     */
    public function show(int $id): Response
    {
        $transaction = $this->transactionService->getTransaction($id);

        if (!$transaction) {
            abort(404, 'Giao dịch không tồn tại.');
        }

        // Load user with roles and permissions for permission checking
        $authUser = auth()->user();
        if ($authUser) {
            $authUser->load(['roles.permissions']);
        }

        return Inertia::render('Admin/Transactions/Show', [
            'transaction' => $transaction,
            'auth' => [
                'user' => $authUser,
            ],
        ]);
    }

    /**
     * Approve a transaction (deposit or withdrawal).
     */
    public function approve(Request $request, int $id)
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $result = $this->transactionService->approveTransaction($id, auth()->id(), $request->reason);

        if ($result['success']) {
            return redirect()->back()->with('success', $result['message']);
        }

        return redirect()->back()->with('error', $result['message']);
    }

    /**
     * Reject a transaction.
     */
    public function reject(Request $request, int $id)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $result = $this->transactionService->rejectTransaction($id, auth()->id(), $request->reason);

        if ($result['success']) {
            return redirect()->back()->with('success', $result['message']);
        }

        return redirect()->back()->with('error', $result['message']);
    }

    /**
     * Get transaction statistics.
     */
    public function stats()
    {
        $stats = $this->transactionService->getStats();
        return response()->json($stats);
    }
}
