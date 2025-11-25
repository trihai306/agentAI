<?php

namespace App\Services;

use App\Repositories\Contracts\DeviceRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class UserDeviceService
{
    protected DeviceRepositoryInterface $deviceRepository;

    public function __construct(DeviceRepositoryInterface $deviceRepository)
    {
        $this->deviceRepository = $deviceRepository;
    }

    /**
     * Get user devices with filters.
     */
    public function getUserDevices(int $userId, array $filters = [], int $perPage = 15)
    {
        return $this->deviceRepository->getUserDevices($userId, $filters, $perPage);
    }

    /**
     * Get a specific device for a user.
     */
    public function getUserDevice(int $userId, int $deviceId)
    {
        return $this->deviceRepository->getUserDevice($userId, $deviceId);
    }

    /**
     * Get device statistics for a user.
     */
    public function getUserDeviceStats(int $userId): array
    {
        return $this->deviceRepository->getUserDeviceStats($userId);
    }

    /**
     * Register a new device for a user.
     */
    public function registerDevice(int $userId, array $data): array
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
            $validated['user_id'] = $userId;
            $validated['is_active'] = $data['is_active'] ?? true;

            $device = $this->deviceRepository->create($validated);

            return [
                'success' => true,
                'device' => $device,
                'message' => 'Thiết bị đã được đăng ký thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('UserDeviceService: Error registering device', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi đăng ký thiết bị: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update a device for a user.
     */
    public function updateDevice(int $userId, int $deviceId, array $data): array
    {
        $device = $this->deviceRepository->getUserDevice($userId, $deviceId);

        if (!$device) {
            return [
                'success' => false,
                'message' => 'Thiết bị không tồn tại hoặc không thuộc về bạn.',
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
            Log::error('UserDeviceService: Error updating device', [
                'user_id' => $userId,
                'device_id' => $deviceId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi cập nhật thiết bị: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Delete a device for a user.
     */
    public function deleteDevice(int $userId, int $deviceId): array
    {
        $device = $this->deviceRepository->getUserDevice($userId, $deviceId);

        if (!$device) {
            return [
                'success' => false,
                'message' => 'Thiết bị không tồn tại hoặc không thuộc về bạn.',
            ];
        }

        try {
            $this->deviceRepository->delete($device);

            return [
                'success' => true,
                'message' => 'Thiết bị đã được xóa thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('UserDeviceService: Error deleting device', [
                'user_id' => $userId,
                'device_id' => $deviceId,
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
    public function toggleActive(int $userId, int $deviceId): array
    {
        $device = $this->deviceRepository->getUserDevice($userId, $deviceId);

        if (!$device) {
            return [
                'success' => false,
                'message' => 'Thiết bị không tồn tại hoặc không thuộc về bạn.',
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
            Log::error('UserDeviceService: Error toggling device active', [
                'user_id' => $userId,
                'device_id' => $deviceId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi cập nhật trạng thái thiết bị: ' . $e->getMessage(),
            ];
        }
    }
}

