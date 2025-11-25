<?php

namespace App\Repositories\Contracts;

use App\Models\Notification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface NotificationRepositoryInterface
{
    /**
     * Get all notifications with filters.
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get notifications for a specific user.
     */
    public function getUserNotifications(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get a notification by ID.
     */
    public function findById(int $id): ?Notification;

    /**
     * Create a new notification.
     */
    public function create(array $data): Notification;

    /**
     * Create notifications for multiple users.
     */
    public function createForUsers(array $userIds, array $data): int;

    /**
     * Update a notification.
     */
    public function update(Notification $notification, array $data): bool;

    /**
     * Delete a notification.
     */
    public function delete(Notification $notification): bool;

    /**
     * Mark notification as read.
     */
    public function markAsRead(Notification $notification): bool;

    /**
     * Mark notification as unread.
     */
    public function markAsUnread(Notification $notification): bool;

    /**
     * Get notification statistics.
     */
    public function getStats(): array;

    /**
     * Get user notification statistics.
     */
    public function getUserStats(int $userId): array;
}

