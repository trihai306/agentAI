<?php

namespace App\Services;

use App\Repositories\Contracts\NotificationRepositoryInterface;

class UserNotificationService
{
    protected NotificationRepositoryInterface $notificationRepository;

    public function __construct(NotificationRepositoryInterface $notificationRepository)
    {
        $this->notificationRepository = $notificationRepository;
    }

    /**
     * Get user notifications with filters.
     */
    public function getUserNotifications(int $userId, array $filters = [], int $perPage = 15)
    {
        return $this->notificationRepository->getUserNotifications($userId, $filters, $perPage);
    }

    /**
     * Get recent unread notifications for a user.
     */
    public function getRecentUnreadNotifications(int $userId, int $limit = 10)
    {
        return \App\Models\Notification::where('user_id', $userId)
            ->where('status', 'unread')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get notification statistics for a user.
     */
    public function getUserNotificationStats(int $userId): array
    {
        return $this->notificationRepository->getUserStats($userId);
    }

    /**
     * Mark notification as read.
     */
    public function markAsRead(int $userId, int $notificationId): array
    {
        $notification = \App\Models\Notification::where('user_id', $userId)
            ->where('id', $notificationId)
            ->first();

        if (!$notification) {
            return [
                'success' => false,
                'message' => 'Thông báo không tồn tại.',
            ];
        }

        $this->notificationRepository->markAsRead($notification);

        return [
            'success' => true,
            'message' => 'Đã đánh dấu đã đọc.',
        ];
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(int $userId): array
    {
        \App\Models\Notification::where('user_id', $userId)
            ->where('status', 'unread')
            ->update([
                'status' => 'read',
                'read_at' => now(),
            ]);

        return [
            'success' => true,
            'message' => 'Đã đánh dấu tất cả là đã đọc.',
        ];
    }
}

