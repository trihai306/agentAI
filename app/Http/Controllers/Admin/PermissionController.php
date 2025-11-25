<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminPermissionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PermissionController extends Controller
{
    protected AdminPermissionService $permissionService;

    public function __construct(AdminPermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }
    /**
     * Display a listing of permissions.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['group', 'search', 'sort_by', 'sort_order', 'per_page']);
        $perPage = $request->get('per_page', 15);

        $permissions = $this->permissionService->getAllPermissions($filters, $perPage);
        $groups = $this->permissionService->getGroups();

        return Inertia::render('Admin/Permissions/Index', [
            'permissions' => $permissions,
            'groups' => $groups,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new permission.
     */
    public function create(): Response
    {
        $groups = $this->permissionService->getGroups();

        return Inertia::render('Admin/Permissions/Form', [
            'groups' => $groups,
        ]);
    }

    /**
     * Store a newly created permission.
     */
    public function store(Request $request)
    {
        $result = $this->permissionService->createPermission($request->all());

        if (!$result['success']) {
            return back()->withErrors($result['errors'] ?? [])
                ->with('error', $result['message'] ?? 'Có lỗi xảy ra khi tạo quyền.');
        }

        return redirect()->route('admin.permissions.index')
            ->with('success', $result['message']);
    }

    /**
     * Show the form for editing the specified permission.
     */
    public function edit(int $id): Response
    {
        $permission = $this->permissionService->getPermission($id);

        if (!$permission) {
            abort(404, 'Quyền không tồn tại.');
        }

        $groups = $this->permissionService->getGroups();

        return Inertia::render('Admin/Permissions/Form', [
            'permission' => $permission,
            'groups' => $groups,
        ]);
    }

    /**
     * Update the specified permission.
     */
    public function update(Request $request, int $id)
    {
        $result = $this->permissionService->updatePermission($id, $request->all());

        if (!$result['success']) {
            return back()->withErrors($result['errors'] ?? [])
                ->with('error', $result['message'] ?? 'Có lỗi xảy ra khi cập nhật quyền.');
        }

        return redirect()->route('admin.permissions.index')
            ->with('success', $result['message']);
    }

    /**
     * Remove the specified permission.
     */
    public function destroy(int $id)
    {
        $result = $this->permissionService->deletePermission($id);

        if (!$result['success']) {
            return redirect()->back()
                ->with('error', $result['message']);
        }

        return redirect()->route('admin.permissions.index')
            ->with('success', $result['message']);
    }
}
