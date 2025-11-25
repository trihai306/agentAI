<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminRoleService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    protected AdminRoleService $roleService;

    public function __construct(AdminRoleService $roleService)
    {
        $this->roleService = $roleService;
    }
    /**
     * Display a listing of roles.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'is_active', 'sort_by', 'sort_order', 'per_page']);
        $perPage = $request->get('per_page', 15);

        $roles = $this->roleService->getAllRoles($filters, $perPage);

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create(): Response
    {
        $permissions = $this->roleService->getPermissionsGrouped();

        return Inertia::render('Admin/Roles/Form', [
            'permissions' => $permissions,
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request)
    {
        $result = $this->roleService->createRole($request->all());

        if (!$result['success']) {
            return back()->withErrors($result['errors'] ?? [])
                ->with('error', $result['message'] ?? 'Có lỗi xảy ra khi tạo vai trò.');
        }

        return redirect()->route('admin.roles.index')
            ->with('success', $result['message']);
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(int $id): Response
    {
        $role = $this->roleService->getRole($id);

        if (!$role) {
            abort(404, 'Vai trò không tồn tại.');
        }

        $permissions = $this->roleService->getPermissionsGrouped();

        return Inertia::render('Admin/Roles/Form', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Update the specified role.
     */
    public function update(Request $request, int $id)
    {
        $result = $this->roleService->updateRole($id, $request->all());

        if (!$result['success']) {
            return back()->withErrors($result['errors'] ?? [])
                ->with('error', $result['message'] ?? 'Có lỗi xảy ra khi cập nhật vai trò.');
        }

        return redirect()->route('admin.roles.index')
            ->with('success', $result['message']);
    }

    /**
     * Remove the specified role.
     */
    public function destroy(int $id)
    {
        $result = $this->roleService->deleteRole($id);

        if (!$result['success']) {
            return redirect()->back()
                ->with('error', $result['message']);
        }

        return redirect()->route('admin.roles.index')
            ->with('success', $result['message']);
    }
}
