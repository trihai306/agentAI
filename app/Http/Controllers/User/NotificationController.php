<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\UserNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    protected UserNotificationService $notificationService;

    public function __construct(UserNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get user notifications (API endpoint).
     */
    public function index(Request $request)
    {
        $userId = Auth::id();
        $filters = $request->only(['status', 'type']);
        $limit = $request->get('limit', 10);

        $notifications = $this->notificationService->getRecentUnreadNotifications($userId, $limit);
        $stats = $this->notificationService->getUserNotificationStats($userId);

        return response()->json([
            'notifications' => $notifications,
            'stats' => $stats,
        ]);
    }

    /**
     * Mark notification as read.
     */
    public function markAsRead(int $id)
    {
        $userId = Auth::id();
        $result = $this->notificationService->markAsRead($userId, $id);

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        return response()->json($result);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead()
    {
        $userId = Auth::id();
        $result = $this->notificationService->markAllAsRead($userId);

        return response()->json($result);
    }
}

