<?php

namespace App\Services;

use App\Repositories\Contracts\ServicePackageRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AdminServicePackageService
{
    protected ServicePackageRepositoryInterface $packageRepository;

    public function __construct(ServicePackageRepositoryInterface $packageRepository)
    {
        $this->packageRepository = $packageRepository;
    }

    /**
     * Get all service packages with filters.
     */
    public function getAllPackages(array $filters = [], int $perPage = 15)
    {
        return $this->packageRepository->getAll($filters, $perPage);
    }

    /**
     * Get a service package by ID.
     */
    public function getPackage(int $id)
    {
        return $this->packageRepository->findById($id);
    }

    /**
     * Create a new service package.
     */
    public function createPackage(array $data): array
    {
        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'type' => 'required|in:messages,api_calls,storage',
            'quota' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'duration_days' => 'nullable|integer|min:1',
            'description' => 'nullable|string',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'errors' => $validator->errors(),
            ];
        }

        try {
            $validated = $validator->validated();
            $package = $this->packageRepository->create($validated);

            return [
                'success' => true,
                'package' => $package,
                'message' => 'Gói dịch vụ đã được tạo thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminServicePackageService: Error creating package', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi tạo gói dịch vụ: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update a service package.
     */
    public function updatePackage(int $id, array $data): array
    {
        $package = $this->packageRepository->findById($id);

        if (!$package) {
            return [
                'success' => false,
                'message' => 'Gói dịch vụ không tồn tại.',
            ];
        }

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'type' => 'required|in:messages,api_calls,storage',
            'quota' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'duration_days' => 'nullable|integer|min:1',
            'description' => 'nullable|string',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'errors' => $validator->errors(),
            ];
        }

        try {
            $validated = $validator->validated();
            $this->packageRepository->update($package, $validated);

            return [
                'success' => true,
                'package' => $package->fresh(),
                'message' => 'Gói dịch vụ đã được cập nhật thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminServicePackageService: Error updating package', [
                'package_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi cập nhật gói dịch vụ: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Delete a service package.
     */
    public function deletePackage(int $id): array
    {
        $package = $this->packageRepository->findById($id);

        if (!$package) {
            return [
                'success' => false,
                'message' => 'Gói dịch vụ không tồn tại.',
            ];
        }

        // Check if package has active user packages
        if ($this->packageRepository->hasActiveUserPackages($package)) {
            return [
                'success' => false,
                'message' => 'Không thể xóa gói dịch vụ đang có người dùng sử dụng.',
            ];
        }

        try {
            $this->packageRepository->delete($package);

            return [
                'success' => true,
                'message' => 'Gói dịch vụ đã được xóa thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminServicePackageService: Error deleting package', [
                'package_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi xóa gói dịch vụ: ' . $e->getMessage(),
            ];
        }
    }
}

