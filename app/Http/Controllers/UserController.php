<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Services\AdminUserService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    protected AdminUserService $userService;

    public function __construct(AdminUserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * Display a listing of users
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'verified', 'sort_by', 'sort_order', 'per_page']);
        $perPage = $request->get('per_page', 15);

        $users = $this->userService->getAllUsers($filters, $perPage);
        $roles = Role::active()->get();

        // Load user with roles and permissions for permission checking
        $authUser = auth()->user();
        if ($authUser) {
            $authUser->load(['roles.permissions']);
        }

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'auth' => [
                'user' => $authUser,
            ],
            'filters' => $filters,
        ]);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        $result = $this->userService->createUser($request->all());

        if (!$result['success']) {
            return back()->withErrors($result['errors'] ?? [])
                ->with('error', $result['message'] ?? 'Có lỗi xảy ra khi tạo người dùng.');
        }

        return redirect()->route('admin.users.index')
            ->with('success', $result['message']);
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, int $id)
    {
        $result = $this->userService->updateUser($id, $request->all());

        if (!$result['success']) {
            return back()->withErrors($result['errors'] ?? [])
                ->with('error', $result['message'] ?? 'Có lỗi xảy ra khi cập nhật người dùng.');
        }

        return redirect()->route('admin.users.index')
            ->with('success', $result['message']);
    }

    /**
     * Remove the specified user
     */
    public function destroy(int $id)
    {
        $result = $this->userService->deleteUser($id, auth()->id());

        if (!$result['success']) {
            return redirect()->route('admin.users.index')
                ->with('error', $result['message']);
        }

        return redirect()->route('admin.users.index')
            ->with('success', $result['message']);
    }

    /**
     * Get user statistics
     */
    public function stats()
    {
        $stats = $this->userService->getStats();
        return response()->json($stats);
    }
}

