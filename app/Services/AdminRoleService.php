<?php

namespace App\Services;

use App\Repositories\Contracts\RoleRepositoryInterface;
use App\Repositories\Contracts\PermissionRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AdminRoleService
{
    protected RoleRepositoryInterface $roleRepository;
    protected PermissionRepositoryInterface $permissionRepository;

    public function __construct(
        RoleRepositoryInterface $roleRepository,
        PermissionRepositoryInterface $permissionRepository
    ) {
        $this->roleRepository = $roleRepository;
        $this->permissionRepository = $permissionRepository;
    }

    /**
     * Get all roles with filters.
     */
    public function getAllRoles(array $filters = [], int $perPage = 15)
    {
        return $this->roleRepository->getAll($filters, $perPage);
    }

    /**
     * Get a role by ID.
     */
    public function getRole(int $id)
    {
        return $this->roleRepository->findById($id);
    }

    /**
     * Get all permissions grouped.
     */
    public function getPermissionsGrouped()
    {
        return $this->permissionRepository->getAllGrouped();
    }

    /**
     * Create a new role.
     */
    public function createRole(array $data): array
    {
        $validator = Validator::make($data, [
            'name' => 'required|string|max:255|unique:roles,name',
            'slug' => 'nullable|string|max:255|unique:roles,slug',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'errors' => $validator->errors(),
            ];
        }

        try {
            $validated = $validator->validated();
            
            if (empty($validated['slug'])) {
                $validated['slug'] = Str::slug($validated['name']);
            }

            $permissions = $validated['permissions'] ?? [];
            unset($validated['permissions']);

            $role = $this->roleRepository->create($validated);

            if (!empty($permissions)) {
                $this->roleRepository->assignPermissions($role, $permissions);
            }

            return [
                'success' => true,
                'role' => $role,
                'message' => 'Vai trò đã được tạo thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminRoleService: Error creating role', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi tạo vai trò: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update a role.
     */
    public function updateRole(int $id, array $data): array
    {
        $role = $this->roleRepository->findById($id);

        if (!$role) {
            return [
                'success' => false,
                'message' => 'Vai trò không tồn tại.',
            ];
        }

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'slug' => 'nullable|string|max:255|unique:roles,slug,' . $role->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'errors' => $validator->errors(),
            ];
        }

        try {
            $validated = $validator->validated();
            
            if (empty($validated['slug'])) {
                $validated['slug'] = Str::slug($validated['name']);
            }

            $permissions = $validated['permissions'] ?? null;
            unset($validated['permissions']);

            $this->roleRepository->update($role, $validated);

            if ($permissions !== null) {
                $this->roleRepository->assignPermissions($role, $permissions);
            }

            return [
                'success' => true,
                'role' => $role->fresh(),
                'message' => 'Vai trò đã được cập nhật thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminRoleService: Error updating role', [
                'role_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi cập nhật vai trò: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Delete a role.
     */
    public function deleteRole(int $id): array
    {
        $role = $this->roleRepository->findById($id);

        if (!$role) {
            return [
                'success' => false,
                'message' => 'Vai trò không tồn tại.',
            ];
        }

        // Check if role has users
        if ($this->roleRepository->hasUsers($role)) {
            return [
                'success' => false,
                'message' => 'Không thể xóa vai trò đang có người dùng sử dụng.',
            ];
        }

        try {
            $this->roleRepository->delete($role);

            return [
                'success' => true,
                'message' => 'Vai trò đã được xóa thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminRoleService: Error deleting role', [
                'role_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi xóa vai trò: ' . $e->getMessage(),
            ];
        }
    }
}

