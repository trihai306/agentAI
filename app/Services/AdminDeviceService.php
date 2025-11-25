<?php

namespace App\Services;

use App\Repositories\Contracts\DeviceRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AdminDeviceService
{
    protected DeviceRepositoryInterface $deviceRepository;

    public function __construct(DeviceRepositoryInterface $deviceRepository)
    {
        $this->deviceRepository = $deviceRepository;
    }

    /**
     * Get all devices with filters.
     */
    public function getAllDevices(array $filters = [], int $perPage = 15)
    {
        return $this->deviceRepository->getAll($filters, $perPage);
    }

    /**
     * Get a device by ID.
     */
    public function getDevice(int $id)
    {
        return $this->deviceRepository->findById($id);
    }

    /**
     * Create a new device.
     */
    public function createDevice(array $data): array
    {
        $validator = Validator::make($data, [
            'udid' => 'required|string|unique:devices,udid',
            'name' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'platform' => 'required|in:android,ios,unknown',
            'version' => 'nullable|string|max:255',
            'status' => 'required|in:device,offline,unauthorized,unknown',
            'screen_size' => 'nullable|array',
            'orientation' => 'nullable|in:portrait,landscape',
            'user_id' => 'nullable|exists:users,id',
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'errors' => $validator->errors(),
            ];
        }

        try {
            $validated = $validator->validated();
            $device = $this->deviceRepository->create($validated);

            return [
                'success' => true,
                'device' => $device,
                'message' => 'Thiết bị đã được tạo thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminDeviceService: Error creating device', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi tạo thiết bị: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update a device.
     */
    public function updateDevice(int $id, array $data): array
    {
        $device = $this->deviceRepository->findById($id);

        if (!$device) {
            return [
                'success' => false,
                'message' => 'Thiết bị không tồn tại.',
            ];
        }

        $validator = Validator::make($data, [
            'name' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'platform' => 'required|in:android,ios,unknown',
            'version' => 'nullable|string|max:255',
            'status' => 'required|in:device,offline,unauthorized,unknown',
            'screen_size' => 'nullable|array',
            'orientation' => 'nullable|in:portrait,landscape',
            'user_id' => 'nullable|exists:users,id',
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'errors' => $validator->errors(),
            ];
        }

        try {
            $validated = $validator->validated();
            $this->deviceRepository->update($device, $validated);

            return [
                'success' => true,
                'device' => $device->fresh(),
                'message' => 'Thiết bị đã được cập nhật thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminDeviceService: Error updating device', [
                'device_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi cập nhật thiết bị: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Delete a device.
     */
    public function deleteDevice(int $id): array
    {
        $device = $this->deviceRepository->findById($id);

        if (!$device) {
            return [
                'success' => false,
                'message' => 'Thiết bị không tồn tại.',
            ];
        }

        try {
            $this->deviceRepository->delete($device);

            return [
                'success' => true,
                'message' => 'Thiết bị đã được xóa thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminDeviceService: Error deleting device', [
                'device_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi xóa thiết bị: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Toggle device active status.
     */
    public function toggleActive(int $id): array
    {
        $device = $this->deviceRepository->findById($id);

        if (!$device) {
            return [
                'success' => false,
                'message' => 'Thiết bị không tồn tại.',
            ];
        }

        try {
            $this->deviceRepository->toggleActive($device);

            return [
                'success' => true,
                'device' => $device->fresh(),
                'message' => 'Trạng thái thiết bị đã được cập nhật.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminDeviceService: Error toggling device active', [
                'device_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi cập nhật trạng thái thiết bị: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get device statistics.
     */
    public function getStats(): array
    {
        return $this->deviceRepository->getStats();
    }
}

