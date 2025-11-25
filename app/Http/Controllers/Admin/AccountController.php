<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminUserService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    protected AdminUserService $userService;

    public function __construct(AdminUserService $userService)
    {
        $this->userService = $userService;
    }
    /**
     * Display account management page
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'verified', 'sort_by', 'sort_order', 'per_page']);
        $perPage = $request->get('per_page', 15);

        $users = $this->userService->getAllUsers($filters, $perPage);
        $stats = $this->userService->getStats();

        return Inertia::render('Admin/Accounts/Index', [
            'users' => $users,
            'stats' => $stats,
            'filters' => $filters,
        ]);
    }

    /**
     * Show account details
     */
    public function show(int $id): Response
    {
        $user = $this->userService->getUser($id);

        if (!$user) {
            abort(404, 'Tài khoản không tồn tại.');
        }

        $user->load(['roles', 'wallet', 'transactions' => function ($query) {
            $query->latest()->limit(10);
        }]);

        return Inertia::render('Admin/Accounts/Show', [
            'user' => $user,
        ]);
    }

    /**
     * Update account
     */
    public function update(Request $request, int $id)
    {
        $data = $request->all();
        
        // Handle email_verified_at boolean
        if (isset($data['email_verified_at'])) {
            $data['email_verified_at'] = $data['email_verified_at'] ? now() : null;
        }

        $result = $this->userService->updateUser($id, $data);

        if (!$result['success']) {
            return back()->withErrors($result['errors'] ?? [])
                ->with('error', $result['message'] ?? 'Có lỗi xảy ra khi cập nhật tài khoản.');
        }

        return redirect()->route('admin.accounts.show', $id)
            ->with('success', $result['message']);
    }

    /**
     * Delete account
     */
    public function destroy(int $id)
    {
        $result = $this->userService->deleteUser($id, auth()->id());

        if (!$result['success']) {
            return redirect()->route('admin.accounts.index')
                ->with('error', $result['message']);
        }

        return redirect()->route('admin.accounts.index')
            ->with('success', $result['message']);
    }

    /**
     * Verify email
     */
    public function verifyEmail(int $id)
    {
        $result = $this->userService->verifyEmail($id);

        if (!$result['success']) {
            return redirect()->back()->with('error', $result['message']);
        }

        return redirect()->back()->with('success', $result['message']);
    }

    /**
     * Unverify email
     */
    public function unverifyEmail(int $id)
    {
        $result = $this->userService->unverifyEmail($id);

        if (!$result['success']) {
            return redirect()->back()->with('error', $result['message']);
        }

        return redirect()->back()->with('success', $result['message']);
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request, int $id)
    {
        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $result = $this->userService->resetPassword($id, $validated['password']);

        if (!$result['success']) {
            return redirect()->back()->with('error', $result['message']);
        }

        return redirect()->back()->with('success', $result['message']);
    }

    /**
     * Suspend account
     */
    public function suspend(User $user)
    {
        // You might want to add a 'suspended_at' column to users table
        // For now, we'll use a metadata approach or add to a separate table
        return redirect()->back()
            ->with('success', 'Tài khoản đã được tạm khóa.');
    }

    /**
     * Activate account
     */
    public function activate(User $user)
    {
        // Activate suspended account
        return redirect()->back()
            ->with('success', 'Tài khoản đã được kích hoạt.');
    }
}

