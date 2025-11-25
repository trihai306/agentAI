<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;

class AssignAdminPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminEmail = 'admin@example.com';

        $user = User::where('email', $adminEmail)->first();

        if (!$user) {
            $this->command->error("User với email {$adminEmail} không tồn tại!");
            return;
        }

        // Lấy tất cả roles
        $allRoles = Role::all();

        if ($allRoles->isEmpty()) {
            $this->command->error("Không có roles nào trong hệ thống!");
            return;
        }

        // Gán tất cả roles cho admin user
        $user->roles()->sync($allRoles->pluck('id')->toArray());

        // Load permissions từ roles để đếm
        $allRoles->load('permissions');
        $allPermissions = $allRoles->pluck('permissions')->flatten()->unique('id');

        $this->command->info("✅ Đã cấp full quyền cho {$adminEmail}!");
        $this->command->info("   - Số roles: {$allRoles->count()}");
        $this->command->info("   - Số permissions: {$allPermissions->count()}");

        // Hiển thị danh sách roles đã gán
        $this->command->info("\n📋 Danh sách roles đã gán:");
        foreach ($allRoles as $role) {
            $this->command->info("   - {$role->name} ({$role->slug})");
        }
    }
}

