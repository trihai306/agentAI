<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminNotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    protected AdminNotificationService $notificationService;

    public function __construct(AdminNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Display a listing of notifications
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['status', 'type', 'search', 'sort_by', 'sort_order', 'per_page']);
        $perPage = $request->get('per_page', 15);

        $notifications = $this->notificationService->getAllNotifications($filters, $perPage);
        $stats = $this->notificationService->getStats();

        return Inertia::render('Admin/Notifications/Index', [
            'notifications' => $notifications,
            'stats' => $stats,
            'filters' => $filters,
        ]);
    }

    /**
     * Store a newly created notification
     */
    public function store(Request $request)
    {
        $result = $this->notificationService->createNotification($request->all());

        if (!$result['success']) {
            return back()->withErrors($result['errors'] ?? [])
                ->with('error', $result['message'] ?? 'Có lỗi xảy ra khi tạo thông báo.');
        }

        return redirect()->route('admin.notifications.index')
            ->with('success', $result['message']);
    }

    /**
     * Remove the specified notification
     */
    public function destroy(int $id)
    {
        $result = $this->notificationService->deleteNotification($id);

        if (!$result['success']) {
            return redirect()->back()
                ->with('error', $result['message']);
        }

        return redirect()->route('admin.notifications.index')
            ->with('success', $result['message']);
    }
}

