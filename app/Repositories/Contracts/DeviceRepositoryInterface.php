<?php

namespace App\Repositories\Contracts;

use App\Models\Device;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface DeviceRepositoryInterface
{
    /**
     * Get all devices with filters (for admin).
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get devices for a specific user with filters.
     */
    public function getUserDevices(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get a device by ID.
     */
    public function findById(int $id): ?Device;

    /**
     * Get a device by UDID.
     */
    public function findByUdid(string $udid): ?Device;

    /**
     * Get a device by ID for a specific user.
     */
    public function getUserDevice(int $userId, int $deviceId): ?Device;

    /**
     * Create a new device.
     */
    public function create(array $data): Device;

    /**
     * Update a device.
     */
    public function update(Device $device, array $data): bool;

    /**
     * Delete a device.
     */
    public function delete(Device $device): bool;

    /**
     * Toggle device active status.
     */
    public function toggleActive(Device $device): bool;

    /**
     * Get device statistics (for admin).
     */
    public function getStats(): array;

    /**
     * Get device statistics for a user.
     */
    public function getUserDeviceStats(int $userId): array;

    /**
     * Find or create device by UDID.
     */
    public function findOrCreateByUdid(string $udid, array $data): Device;

    /**
     * Update device last seen timestamp.
     */
    public function updateLastSeen(Device $device): bool;

    /**
     * Mark devices as offline by UDIDs.
     */
    public function markOfflineByUdids(array $activeUdids): int;
}

