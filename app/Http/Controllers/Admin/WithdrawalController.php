<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalSetting;
use App\Services\AdminTransactionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WithdrawalController extends Controller
{
    protected AdminTransactionService $transactionService;

    public function __construct(AdminTransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    /**
     * Display a listing of withdrawal requests.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['date_from', 'date_to', 'search', 'sort_by', 'sort_order', 'per_page']);
        $perPage = $request->get('per_page', 15);

        $withdrawals = $this->transactionService->getPendingWithdrawals($filters, $perPage);

        return Inertia::render('Admin/Withdrawals/Index', [
            'withdrawals' => $withdrawals,
            'filters' => $filters,
        ]);
    }

    /**
     * Approve a withdrawal request.
     */
    public function approve(Request $request, int $id)
    {
        $result = $this->transactionService->approveTransaction($id, auth()->id());

        if ($result['success']) {
            return redirect()->back()->with('success', $result['message']);
        }

        return redirect()->back()->with('error', $result['message']);
    }

    /**
     * Reject a withdrawal request.
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
     * Display withdrawal settings.
     */
    public function settings(): Response
    {
        $settings = WithdrawalSetting::getSettings();

        return Inertia::render('Admin/Withdrawals/Settings', [
            'settings' => $settings,
        ]);
    }

    /**
     * Update withdrawal settings.
     */
    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'auto_approve_threshold' => 'required|numeric|min:0',
            'min_withdrawal' => 'required|numeric|min:0',
            'max_withdrawal' => 'required|numeric|min:0',
            'fee_percentage' => 'required|numeric|min:0|max:100',
            'fee_fixed' => 'required|numeric|min:0',
        ]);

        $settings = WithdrawalSetting::getSettings();
        $settings->update($validated);

        return redirect()->back()->with('success', 'Cấu hình rút tiền đã được cập nhật thành công.');
    }
}
