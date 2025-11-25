<?php

namespace Database\Seeders;

use App\Models\WithdrawalSetting;
use Illuminate\Database\Seeder;

class WithdrawalSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        WithdrawalSetting::firstOrCreate(
            ['id' => 1],
            [
                'auto_approve_threshold' => 1000000, // 1 triệu VND
                'min_withdrawal' => 50000, // 50k VND
                'max_withdrawal' => 100000000, // 100 triệu VND
                'fee_percentage' => 0, // 0%
                'fee_fixed' => 0, // 0 VND
            ]
        );

        $this->command->info('✅ Đã tạo cấu hình rút tiền mặc định!');
    }
}
