<?php

namespace App\Http\Controllers;

use App\Services\AdminDeviceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeviceController extends Controller
{
    protected AdminDeviceService $deviceService;

    public function __construct(AdminDeviceService $deviceService)
    {
        $this->deviceService = $deviceService;
    }

    /**
     * Display a listing of devices.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'status', 'platform', 'is_active', 'sort_by', 'sort_order', 'user_id']);
        $perPage = $request->get('per_page', 15);

        $devices = $this->deviceService->getAllDevices($filters, $perPage);
        $stats = $this->deviceService->getStats();

        return Inertia::render('Admin/Devices/Index', [
            'devices' => $devices,
            'stats' => $stats,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new device.
     */
    public function create()
    {
        return Inertia::render('Admin/Devices/Create');
    }

    /**
     * Store a newly created device.
     */
    public function store(Request $request)
    {
        $result = $this->deviceService->createDevice($request->all());

        if (!$result['success']) {
            return back()->withErrors($result['errors'] ?? [])
                ->with('error', $result['message'] ?? 'Có lỗi xảy ra khi tạo thiết bị.');
        }

        return redirect()->route('admin.devices.index')
            ->with('success', $result['message']);
    }

    /**
     * Display the specified device.
     */
    public function show(int $id)
    {
        $device = $this->deviceService->getDevice($id);

        if (!$device) {
            abort(404, 'Thiết bị không tồn tại.');
        }

        return Inertia::render('Admin/Devices/Show', [
            'device' => $device,
        ]);
    }

    /**
     * Show the form for editing the specified device.
     */
    public function edit(int $id)
    {
        $device = $this->deviceService->getDevice($id);

        if (!$device) {
            abort(404, 'Thiết bị không tồn tại.');
        }

        return Inertia::render('Admin/Devices/Edit', [
            'device' => $device,
        ]);
    }

    /**
     * Update the specified device.
     */
    public function update(Request $request, int $id)
    {
        $result = $this->deviceService->updateDevice($id, $request->all());

        if (!$result['success']) {
            return back()->withErrors($result['errors'] ?? [])
                ->with('error', $result['message'] ?? 'Có lỗi xảy ra khi cập nhật thiết bị.');
        }

        return redirect()->route('admin.devices.index')
            ->with('success', $result['message']);
    }

    /**
     * Remove the specified device.
     */
    public function destroy(int $id)
    {
        $result = $this->deviceService->deleteDevice($id);

        if (!$result['success']) {
            return back()->with('error', $result['message'] ?? 'Có lỗi xảy ra khi xóa thiết bị.');
        }

        return redirect()->route('admin.devices.index')
            ->with('success', $result['message']);
    }


    /**
     * Get device statistics.
     */
    public function stats()
    {
        $stats = $this->deviceService->getStats();
        
        return response()->json($stats);
    }

    /**
     * Toggle device active status.
     */
    public function toggleActive(int $id)
    {
        $result = $this->deviceService->toggleActive($id);

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
