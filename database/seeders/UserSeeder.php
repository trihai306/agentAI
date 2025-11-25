<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Tạo tài khoản admin
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
            ]
        );

        // Tạo tài khoản test
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('test123'),
                'email_verified_at' => now(),
            ]
        );

        // Tạo tài khoản demo
        User::firstOrCreate(
            ['email' => 'demo@example.com'],
            [
                'name' => 'Demo User',
                'password' => Hash::make('demo123'),
                'email_verified_at' => now(),
            ]
        );

        // Tạo tài khoản user thường
        User::firstOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Regular User',
                'password' => Hash::make('user123'),
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('✅ Đã tạo seed tài khoản thành công!');
        $this->command->info('');
        $this->command->info('📋 Danh sách tài khoản:');
        $this->command->info('  1. admin@example.com / admin123');
        $this->command->info('  2. test@example.com / test123');
        $this->command->info('  3. demo@example.com / demo123');
        $this->command->info('  4. user@example.com / user123');
    }
}

