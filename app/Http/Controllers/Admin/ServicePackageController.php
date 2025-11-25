<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminServicePackageService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServicePackageController extends Controller
{
    protected AdminServicePackageService $packageService;

    public function __construct(AdminServicePackageService $packageService)
    {
        $this->packageService = $packageService;
    }

    /**
     * Display a listing of service packages.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['type', 'is_active', 'search', 'sort_by', 'sort_order', 'per_page']);
        $perPage = $request->get('per_page', 15);

        $packages = $this->packageService->getAllPackages($filters, $perPage);

        return Inertia::render('Admin/Packages/Index', [
            'packages' => $packages,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new package.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Packages/Form');
    }

    /**
     * Store a newly created package.
     */
    public function store(Request $request)
    {
        $result = $this->packageService->createPackage($request->all());

        if (!$result['success']) {
            return back()->withErrors($result['errors'] ?? [])
                ->with('error', $result['message'] ?? 'Có lỗi xảy ra khi tạo gói dịch vụ.');
        }

        return redirect()->route('admin.packages.index')
            ->with('success', $result['message']);
    }

    /**
     * Show the form for editing the specified package.
     */
    public function edit(int $id): Response
    {
        $package = $this->packageService->getPackage($id);

        if (!$package) {
            abort(404, 'Gói dịch vụ không tồn tại.');
        }

        return Inertia::render('Admin/Packages/Form', [
            'package' => $package,
        ]);
    }

    /**
     * Update the specified package.
     */
    public function update(Request $request, int $id)
    {
        $result = $this->packageService->updatePackage($id, $request->all());

        if (!$result['success']) {
            return back()->withErrors($result['errors'] ?? [])
                ->with('error', $result['message'] ?? 'Có lỗi xảy ra khi cập nhật gói dịch vụ.');
        }

        return redirect()->route('admin.packages.index')
            ->with('success', $result['message']);
    }

    /**
     * Remove the specified package.
     */
    public function destroy(int $id)
    {
        $result = $this->packageService->deletePackage($id);

        if (!$result['success']) {
            return redirect()->back()
                ->with('error', $result['message']);
        }

        return redirect()->route('admin.packages.index')
            ->with('success', $result['message']);
    }
}
