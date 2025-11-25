<?php

namespace App\Services;

use App\Repositories\Contracts\PermissionRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AdminPermissionService
{
    protected PermissionRepositoryInterface $permissionRepository;

    public function __construct(PermissionRepositoryInterface $permissionRepository)
    {
        $this->permissionRepository = $permissionRepository;
    }

    /**
     * Get all permissions with filters.
     */
    public function getAllPermissions(array $filters = [], int $perPage = 15)
    {
        return $this->permissionRepository->getAll($filters, $perPage);
    }

    /**
     * Get unique groups.
     */
    public function getGroups()
    {
        return $this->permissionRepository->getGroups();
    }

    /**
     * Get a permission by ID.
     */
    public function getPermission(int $id)
    {
        return $this->permissionRepository->findById($id);
    }

    /**
     * Create a new permission.
     */
    public function createPermission(array $data): array
    {
        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:permissions,slug',
            'group' => 'nullable|string|max:255',
            'description' => 'nullable|string',
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

            $permission = $this->permissionRepository->create($validated);

            return [
                'success' => true,
                'permission' => $permission,
                'message' => 'Quyền đã được tạo thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminPermissionService: Error creating permission', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi tạo quyền: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update a permission.
     */
    public function updatePermission(int $id, array $data): array
    {
        $permission = $this->permissionRepository->findById($id);

        if (!$permission) {
            return [
                'success' => false,
                'message' => 'Quyền không tồn tại.',
            ];
        }

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:permissions,slug,' . $permission->id,
            'group' => 'nullable|string|max:255',
            'description' => 'nullable|string',
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

            $this->permissionRepository->update($permission, $validated);

            return [
                'success' => true,
                'permission' => $permission->fresh(),
                'message' => 'Quyền đã được cập nhật thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminPermissionService: Error updating permission', [
                'permission_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi cập nhật quyền: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Delete a permission.
     */
    public function deletePermission(int $id): array
    {
        $permission = $this->permissionRepository->findById($id);

        if (!$permission) {
            return [
                'success' => false,
                'message' => 'Quyền không tồn tại.',
            ];
        }

        // Check if permission is assigned to any role
        if ($this->permissionRepository->hasRoles($permission)) {
            return [
                'success' => false,
                'message' => 'Không thể xóa quyền đang được gán cho vai trò.',
            ];
        }

        try {
            $this->permissionRepository->delete($permission);

            return [
                'success' => true,
                'message' => 'Quyền đã được xóa thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminPermissionService: Error deleting permission', [
                'permission_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi xóa quyền: ' . $e->getMessage(),
            ];
        }
    }
}

