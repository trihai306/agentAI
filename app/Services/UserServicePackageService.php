<?php

namespace App\Services;

use App\Repositories\Contracts\ServicePackageRepositoryInterface;
use App\Services\PaymentService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class UserServicePackageService
{
    protected ServicePackageRepositoryInterface $packageRepository;
    protected PaymentService $paymentService;

    public function __construct(
        ServicePackageRepositoryInterface $packageRepository,
        PaymentService $paymentService
    ) {
        $this->packageRepository = $packageRepository;
        $this->paymentService = $paymentService;
    }

    /**
     * Get available service packages.
     */
    public function getAvailablePackages(array $filters = [])
    {
        $packages = $this->packageRepository->getActive($filters);
        // Group by type and convert each group to array for proper serialization
        $grouped = $packages->groupBy('type');

        // Convert to array format that Inertia can properly serialize
        $result = [];
        foreach ($grouped as $type => $items) {
            $result[$type] = $items->values()->toArray();
        }

        return $result;
    }

    /**
     * Purchase a service package.
     */
    public function purchasePackage(int $userId, int $packageId): array
    {
        $package = $this->packageRepository->findById($packageId);

        if (!$package) {
            return [
                'success' => false,
                'message' => 'Gói dịch vụ không tồn tại.',
            ];
        }

        if (!$package->is_active) {
            return [
                'success' => false,
                'message' => 'Gói dịch vụ không khả dụng.',
            ];
        }

        try {
            $result = $this->paymentService->processPurchase($userId, $packageId);

            if (!$result['success']) {
                return [
                    'success' => false,
                    'errors' => $result['errors'] ?? [],
                    'message' => $result['message'] ?? 'Có lỗi xảy ra khi mua gói dịch vụ',
                ];
            }

            return [
                'success' => true,
                'message' => 'Mua gói dịch vụ thành công!',
            ];
        } catch (\Exception $e) {
            Log::error('UserServicePackageService: Error purchasing package', [
                'user_id' => $userId,
                'package_id' => $packageId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi khi mua gói dịch vụ: ' . $e->getMessage(),
            ];
        }
    }
}

