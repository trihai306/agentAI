<?php

namespace App\Repositories;

use App\Models\Device;
use App\Repositories\Contracts\DeviceRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Carbon\Carbon;

class DeviceRepository implements DeviceRepositoryInterface
{
    /**
     * Get devices for a specific user with filters.
     */
    public function getUserDevices(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Device::where('user_id', $userId);

        // Search
        if (isset($filters['search']) && $filters['search']) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('udid', 'like', "%{$search}%")
                  ->orWhere('version', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if (isset($filters['status']) && $filters['status']) {
            $query->where('status', $filters['status']);
        }

        // Filter by platform
        if (isset($filters['platform']) && $filters['platform']) {
            $query->where('platform', $filters['platform']);
        }

        // Filter by active
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        // Sort
        $sortBy = $filters['sort_by'] ?? 'last_seen_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Get a device by ID for a specific user.
     */
    public function getUserDevice(int $userId, int $deviceId): ?Device
    {
        return Device::where('user_id', $userId)
            ->where('id', $deviceId)
            ->first();
    }

    /**
     * Get device statistics for a user.
     */
    public function getUserDeviceStats(int $userId): array
    {
        $total = Device::where('user_id', $userId)->count();
        $connected = Device::where('user_id', $userId)
            ->where('status', 'device')
            ->where('is_active', true)
            ->count();
        $android = Device::where('user_id', $userId)
            ->where('platform', 'android')
            ->count();
        $ios = Device::where('user_id', $userId)
            ->where('platform', 'ios')
            ->count();
        $active = Device::where('user_id', $userId)
            ->where('is_active', true)
            ->count();

        return [
            'total' => $total,
            'connected' => $connected,
            'android' => $android,
            'ios' => $ios,
            'active' => $active,
        ];
    }

    /**
     * Create a new device for a user.
     */
    public function create(array $data): Device
    {
        return Device::create($data);
    }

    /**
     * Update a device.
     */
    public function update(Device $device, array $data): bool
    {
        return $device->update($data);
    }

    /**
     * Delete a device.
     */
    public function delete(Device $device): bool
    {
        return $device->delete();
    }

    /**
     * Toggle device active status.
     */
    public function toggleActive(Device $device): bool
    {
        return $device->update(['is_active' => !$device->is_active]);
    }

    /**
     * Get all devices with filters (for admin).
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Device::query();

        // Search
        if (isset($filters['search']) && $filters['search']) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('udid', 'like', "%{$search}%")
                  ->orWhere('version', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if (isset($filters['status']) && $filters['status']) {
            $query->where('status', $filters['status']);
        }

        // Filter by platform
        if (isset($filters['platform']) && $filters['platform']) {
            $query->where('platform', $filters['platform']);
        }

        // Filter by active
        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $query->where('is_active', $filters['is_active']);
        }

        // Filter by user
        if (isset($filters['user_id']) && $filters['user_id']) {
            $query->where('user_id', $filters['user_id']);
        }

        // Sort
        $sortBy = $filters['sort_by'] ?? 'last_seen_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->with('user')->paginate($perPage)->withQueryString();
    }

    /**
     * Get a device by ID.
     */
    public function findById(int $id): ?Device
    {
        return Device::with('user')->find($id);
    }

    /**
     * Get a device by UDID.
     */
    public function findByUdid(string $udid): ?Device
    {
        return Device::where('udid', $udid)->first();
    }

    /**
     * Get device statistics (for admin).
     */
    public function getStats(): array
    {
        return [
            'total' => Device::count(),
            'connected' => Device::connected()->count(),
            'offline' => Device::where('status', 'offline')->count(),
            'android' => Device::platform('android')->count(),
            'ios' => Device::platform('ios')->count(),
            'active' => Device::active()->count(),
        ];
    }

    /**
     * Find or create device by UDID.
     */
    public function findOrCreateByUdid(string $udid, array $data): Device
    {
        return Device::firstOrCreate(
            ['udid' => $udid],
            $data
        );
    }

    /**
     * Update device last seen timestamp.
     */
    public function updateLastSeen(Device $device): bool
    {
        return $device->update(['last_seen_at' => Carbon::now()]);
    }

    /**
     * Mark devices as offline by UDIDs.
     */
    public function markOfflineByUdids(array $activeUdids): int
    {
        return Device::whereNotIn('udid', $activeUdids)
            ->where('status', 'device')
            ->where('is_active', true)
            ->update([
                'status' => 'offline',
                'last_seen_at' => Carbon::now(),
            ]);
    }
}

