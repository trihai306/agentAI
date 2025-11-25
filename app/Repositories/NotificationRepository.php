<?php

namespace App\Repositories;

use App\Models\Notification;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NotificationRepository implements NotificationRepositoryInterface
{
    /**
     * Get all notifications with filters.
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Notification::with('user');

        // Filters
        if (isset($filters['status']) && $filters['status']) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['type']) && $filters['type']) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['search']) && $filters['search']) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Get notifications for a specific user.
     */
    public function getUserNotifications(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Notification::where('user_id', $userId);

        // Filters
        if (isset($filters['status']) && $filters['status']) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['type']) && $filters['type']) {
            $query->where('type', $filters['type']);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Get a notification by ID.
     */
    public function findById(int $id): ?Notification
    {
        return Notification::find($id);
    }

    /**
     * Create a new notification.
     */
    public function create(array $data): Notification
    {
        return Notification::create($data);
    }

    /**
     * Create notifications for multiple users.
     */
    public function createForUsers(array $userIds, array $data): int
    {
        $notifications = [];
        foreach ($userIds as $userId) {
            $notifications[] = [
                'user_id' => $userId,
                'title' => $data['title'],
                'message' => $data['message'],
                'type' => $data['type'],
                'status' => 'unread',
                'target_type' => $data['target_type'] ?? null,
                'target_id' => $data['target_id'] ?? null,
                'metadata' => $data['metadata'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        Notification::insert($notifications);
        return count($notifications);
    }

    /**
     * Update a notification.
     */
    public function update(Notification $notification, array $data): bool
    {
        return $notification->update($data);
    }

    /**
     * Delete a notification.
     */
    public function delete(Notification $notification): bool
    {
        return $notification->delete();
    }

    /**
     * Mark notification as read.
     */
    public function markAsRead(Notification $notification): bool
    {
        $notification->markAsRead();
        return true;
    }

    /**
     * Mark notification as unread.
     */
    public function markAsUnread(Notification $notification): bool
    {
        $notification->markAsUnread();
        return true;
    }

    /**
     * Get notification statistics.
     */
    public function getStats(): array
    {
        return [
            'total' => Notification::count(),
            'unread' => Notification::where('status', 'unread')->count(),
            'read' => Notification::where('status', 'read')->count(),
            'by_type' => [
                'info' => Notification::where('type', 'info')->count(),
                'success' => Notification::where('type', 'success')->count(),
                'warning' => Notification::where('type', 'warning')->count(),
                'error' => Notification::where('type', 'error')->count(),
            ],
        ];
    }

    /**
     * Get user notification statistics.
     */
    public function getUserStats(int $userId): array
    {
        return [
            'total' => Notification::where('user_id', $userId)->count(),
            'unread' => Notification::where('user_id', $userId)->where('status', 'unread')->count(),
            'read' => Notification::where('user_id', $userId)->where('status', 'read')->count(),
        ];
    }
}

