<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\UserDeviceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DeviceController extends Controller
{
    protected UserDeviceService $deviceService;

    public function __construct(UserDeviceService $deviceService)
    {
        $this->deviceService = $deviceService;
    }

    /**
     * Display a listing of the user's devices.
     */
    public function index(Request $request): Response
    {
        $userId = Auth::id();
        $filters = $request->only(['search', 'status', 'platform', 'is_active', 'sort_by', 'sort_order', 'per_page']);

        $devices = $this->deviceService->getUserDevices(
            $userId,
            $filters,
            $request->get('per_page', 15)
        );

        $stats = $this->deviceService->getUserDeviceStats($userId);

        // Generate fixed token for user (based on user ID and APP_KEY)
        // Token will be the same for each user across all sessions
        $appKey = config('app.key');
        // Token format: userId:appKey:hash(userId+appKey)
        $hash = hash('sha256', $userId . $appKey);
        $token = base64_encode($userId . ':' . $appKey . ':' . $hash);

        return Inertia::render('User/Devices/Index', [
            'devices' => $devices,
            'stats' => $stats,
            'filters' => $filters,
            'token' => $token,
        ]);
    }

    /**
     * Show the form for creating a new device.
     */
    public function create(): Response
    {
        return Inertia::render('User/Devices/Create');
    }

    /**
     * Store a newly created device.
     */
    public function store(Request $request)
    {
        $userId = Auth::id();
        $result = $this->deviceService->registerDevice($userId, $request->all());

        if (!$result['success']) {
            return back()->withErrors($result['errors'] ?? [])
                ->with('error', $result['message'] ?? 'Có lỗi xảy ra khi đăng ký thiết bị.');
        }

        return redirect()->route('devices.index')
            ->with('success', $result['message']);
    }

    /**
     * Display the specified device.
     */
    public function show(int $id): Response
    {
        $userId = Auth::id();
        $device = $this->deviceService->getUserDevice($userId, $id);

        if (!$device) {
            abort(404, 'Thiết bị không tồn tại hoặc không thuộc về bạn.');
        }

        return Inertia::render('User/Devices/Show', [
            'device' => $device,
        ]);
    }

    /**
     * Show the form for editing the specified device.
     */
    public function edit(int $id): Response
    {
        $userId = Auth::id();
        $device = $this->deviceService->getUserDevice($userId, $id);

        if (!$device) {
            abort(404, 'Thiết bị không tồn tại hoặc không thuộc về bạn.');
        }

        return Inertia::render('User/Devices/Edit', [
            'device' => $device,
        ]);
    }

    /**
     * Update the specified device.
     */
    public function update(Request $request, int $id)
    {
        $userId = Auth::id();
        $result = $this->deviceService->updateDevice($userId, $id, $request->all());

        if (!$result['success']) {
            return back()->withErrors($result['errors'] ?? [])
                ->with('error', $result['message'] ?? 'Có lỗi xảy ra khi cập nhật thiết bị.');
        }

        return redirect()->route('devices.index')
            ->with('success', $result['message']);
    }

    /**
     * Remove the specified device.
     */
    public function destroy(int $id)
    {
        $userId = Auth::id();
        $result = $this->deviceService->deleteDevice($userId, $id);

        if (!$result['success']) {
            return back()->with('error', $result['message'] ?? 'Có lỗi xảy ra khi xóa thiết bị.');
        }

        return redirect()->route('devices.index')
            ->with('success', $result['message']);
    }

    /**
     * Toggle device active status.
     */
    public function toggleActive(int $id)
    {
        $userId = Auth::id();
        $result = $this->deviceService->toggleActive($userId, $id);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 400);
        }

        return response()->json([
            'success' => true,
            'is_active' => $result['device']->is_active,
            'message' => $result['message'],
        ]);
    }
}

