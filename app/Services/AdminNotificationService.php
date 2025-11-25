<?php

namespace App\Services;

use App\Models\User;
use App\Models\Role;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AdminNotificationService
{
    protected NotificationRepositoryInterface $notificationRepository;

    public function __construct(NotificationRepositoryInterface $notificationRepository)
    {
        $this->notificationRepository = $notificationRepository;
    }

    /**
     * Get all notifications with filters.
     */
    public function getAllNotifications(array $filters = [], int $perPage = 15)
    {
        return $this->notificationRepository->getAll($filters, $perPage);
    }

    /**
     * Get notification statistics.
     */
    public function getStats(): array
    {
        return $this->notificationRepository->getStats();
    }

    /**
     * Create and send notifications.
     */
    public function createNotification(array $data): array
    {
        $validator = Validator::make($data, [
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|in:info,success,warning,error',
            'target_type' => 'required|in:all,user,role',
            'target_id' => 'nullable|required_if:target_type,user,role',
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
            $count = 0;

            if ($validated['target_type'] === 'all') {
                // Send to all users
                $userIds = User::pluck('id')->toArray();
                $count = $this->notificationRepository->createForUsers($userIds, $validated);
            } elseif ($validated['target_type'] === 'user') {
                // Send to specific user
                $notification = $this->notificationRepository->create([
                    'user_id' => $validated['target_id'],
                    'title' => $validated['title'],
                    'message' => $validated['message'],
                    'type' => $validated['type'],
                    'status' => 'unread',
                    'target_type' => 'user',
                    'target_id' => $validated['target_id'],
                    'metadata' => $validated['metadata'] ?? null,
                ]);
                $count = 1;
            } elseif ($validated['target_type'] === 'role') {
                // Send to users with specific role
                $role = Role::find($validated['target_id']);
                if ($role) {
                    $userIds = $role->users()->pluck('id')->toArray();
                    $count = $this->notificationRepository->createForUsers($userIds, $validated);
                }
            }

            return [
                'success' => true,
                'count' => $count,
                'message' => "Đã gửi thông báo đến {$count} người dùng.",
            ];
        } catch (\Exception $e) {
            Log::error('AdminNotificationService: Error creating notification', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi tạo thông báo: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Delete a notification.
     */
    public function deleteNotification(int $id): array
    {
        $notification = $this->notificationRepository->findById($id);

        if (!$notification) {
            return [
                'success' => false,
                'message' => 'Thông báo không tồn tại.',
            ];
        }

        try {
            $this->notificationRepository->delete($notification);

            return [
                'success' => true,
                'message' => 'Thông báo đã được xóa thành công.',
            ];
        } catch (\Exception $e) {
            Log::error('AdminNotificationService: Error deleting notification', [
                'notification_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi xóa thông báo: ' . $e->getMessage(),
            ];
        }
    }
}

