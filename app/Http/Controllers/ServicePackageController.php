<?php

namespace App\Http\Controllers;

use App\Services\UserServicePackageService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServicePackageController extends Controller
{
    protected UserServicePackageService $packageService;

    public function __construct(UserServicePackageService $packageService)
    {
        $this->packageService = $packageService;
    }

    /**
     * Display a listing of available service packages.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['type', 'sort_by', 'sort_order']);
        $packages = $this->packageService->getAvailablePackages($filters);

        // Get user's purchased package IDs (active only)
        $purchasedPackageIds = \App\Models\UserPackage::where('user_id', auth()->id())
            ->where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->pluck('package_id')
            ->toArray();

        return Inertia::render('Packages/Index', [
            'packages' => $packages,
            'filters' => $filters,
            'purchasedPackageIds' => $purchasedPackageIds,
        ]);
    }

    /**
     * Purchase a service package.
     */
    public function purchase(Request $request, int $id)
    {
        $result = $this->packageService->purchasePackage(auth()->id(), $id);

        if (!$result['success']) {
            return redirect()->back()
                ->withErrors($result['errors'] ?? [])
                ->with('error', $result['message']);
        }

        return redirect()->route('packages.my-packages')
            ->with('success', $result['message']);
    }

    /**
     * Display user's purchased packages.
     */
    public function myPackages(Request $request): Response
    {
        // TODO: Create UserPackageRepository and service if needed
        $query = \App\Models\UserPackage::where('user_id', auth()->id())
            ->with('package');

        // Filter by status
        if ($request->has('status') && $request->status) {
            if ($request->status === 'active') {
                $query->active();
            } elseif ($request->status === 'expired') {
                $query->expired();
            } else {
                $query->where('status', $request->status);
            }
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'purchased_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $userPackages = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Packages/MyPackages', [
            'userPackages' => $userPackages,
            'filters' => $request->only(['status', 'sort_by', 'sort_order', 'per_page']),
        ]);
    }
}
