<?php

namespace Database\Seeders;

use App\Models\ServicePackage;
use Illuminate\Database\Seeder;

class ServicePackageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $packages = [
            // Chat Messages Packages
            [
                'name' => 'Gói Messages Cơ bản',
                'type' => 'messages',
                'quota' => 1000,
                'price' => 100000,
                'duration_days' => 30,
                'description' => 'Gói cơ bản cho người dùng mới bắt đầu',
                'features' => [
                    '1,000 tin nhắn/tháng',
                    'Hỗ trợ đầy đủ tính năng chat',
                    'Lưu trữ lịch sử 30 ngày',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Gói Messages Nâng cao',
                'type' => 'messages',
                'quota' => 5000,
                'price' => 400000,
                'duration_days' => 30,
                'description' => 'Gói phù hợp cho người dùng thường xuyên',
                'features' => [
                    '5,000 tin nhắn/tháng',
                    'Hỗ trợ đầy đủ tính năng chat',
                    'Lưu trữ lịch sử 90 ngày',
                    'Ưu tiên xử lý',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Gói Messages Không giới hạn',
                'type' => 'messages',
                'quota' => 999999999,
                'price' => 2000000,
                'duration_days' => 30,
                'description' => 'Gói không giới hạn cho doanh nghiệp',
                'features' => [
                    'Tin nhắn không giới hạn',
                    'Hỗ trợ đầy đủ tính năng chat',
                    'Lưu trữ vô thời hạn',
                    'Ưu tiên xử lý cao nhất',
                    'Hỗ trợ 24/7',
                ],
                'is_active' => true,
            ],
            // API Calls Packages
            [
                'name' => 'Gói API Cơ bản',
                'type' => 'api_calls',
                'quota' => 10000,
                'price' => 200000,
                'duration_days' => 30,
                'description' => 'Gói API cho ứng dụng nhỏ',
                'features' => [
                    '10,000 API calls/tháng',
                    'Rate limit: 100 calls/phút',
                    'Hỗ trợ tất cả endpoints',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Gói API Doanh nghiệp',
                'type' => 'api_calls',
                'quota' => 100000,
                'price' => 1500000,
                'duration_days' => 30,
                'description' => 'Gói API cho doanh nghiệp',
                'features' => [
                    '100,000 API calls/tháng',
                    'Rate limit: 1000 calls/phút',
                    'Hỗ trợ tất cả endpoints',
                    'Webhook support',
                    'Priority support',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Gói API Không giới hạn',
                'type' => 'api_calls',
                'quota' => 999999999,
                'price' => 5000000,
                'duration_days' => 30,
                'description' => 'Gói API không giới hạn',
                'features' => [
                    'API calls không giới hạn',
                    'Rate limit: Không giới hạn',
                    'Hỗ trợ tất cả endpoints',
                    'Webhook support',
                    'Dedicated support',
                ],
                'is_active' => true,
            ],
            // Storage Packages
            [
                'name' => 'Gói Storage Cơ bản',
                'type' => 'storage',
                'quota' => 10737418240, // 10 GB
                'price' => 50000,
                'duration_days' => 30,
                'description' => 'Gói lưu trữ cơ bản',
                'features' => [
                    '10 GB dung lượng',
                    'Lưu trữ files và media',
                    'Backup tự động',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Gói Storage Nâng cao',
                'type' => 'storage',
                'quota' => 107374182400, // 100 GB
                'price' => 400000,
                'duration_days' => 30,
                'description' => 'Gói lưu trữ cho người dùng nhiều',
                'features' => [
                    '100 GB dung lượng',
                    'Lưu trữ files và media',
                    'Backup tự động',
                    'CDN support',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Gói Storage Doanh nghiệp',
                'type' => 'storage',
                'quota' => 1073741824000, // 1 TB
                'price' => 3000000,
                'duration_days' => 30,
                'description' => 'Gói lưu trữ cho doanh nghiệp',
                'features' => [
                    '1 TB dung lượng',
                    'Lưu trữ files và media',
                    'Backup tự động',
                    'CDN support',
                    'Dedicated storage',
                ],
                'is_active' => true,
            ],
        ];

        foreach ($packages as $package) {
            ServicePackage::firstOrCreate(
                ['name' => $package['name'], 'type' => $package['type']],
                $package
            );
        }

        $this->command->info('✅ Đã tạo ' . count($packages) . ' gói dịch vụ mẫu!');
    }
}
