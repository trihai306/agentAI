<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Permissions
        $permissions = [
            // User Management
            ['name' => 'Xem người dùng', 'slug' => 'users.view', 'group' => 'users'],
            ['name' => 'Tạo người dùng', 'slug' => 'users.create', 'group' => 'users'],
            ['name' => 'Sửa người dùng', 'slug' => 'users.edit', 'group' => 'users'],
            ['name' => 'Xóa người dùng', 'slug' => 'users.delete', 'group' => 'users'],

            // Transaction Management
            ['name' => 'Xem giao dịch', 'slug' => 'transactions.view', 'group' => 'transactions'],
            ['name' => 'Phê duyệt giao dịch', 'slug' => 'transactions.approve', 'group' => 'transactions'],
            ['name' => 'Từ chối giao dịch', 'slug' => 'transactions.reject', 'group' => 'transactions'],

            // Package Management
            ['name' => 'Xem gói dịch vụ', 'slug' => 'packages.view', 'group' => 'packages'],
            ['name' => 'Tạo gói dịch vụ', 'slug' => 'packages.create', 'group' => 'packages'],
            ['name' => 'Sửa gói dịch vụ', 'slug' => 'packages.edit', 'group' => 'packages'],
            ['name' => 'Xóa gói dịch vụ', 'slug' => 'packages.delete', 'group' => 'packages'],

            // Withdrawal Management
            ['name' => 'Xem yêu cầu rút tiền', 'slug' => 'withdrawals.view', 'group' => 'withdrawals'],
            ['name' => 'Phê duyệt rút tiền', 'slug' => 'withdrawals.approve', 'group' => 'withdrawals'],
            ['name' => 'Từ chối rút tiền', 'slug' => 'withdrawals.reject', 'group' => 'withdrawals'],
            ['name' => 'Cấu hình rút tiền', 'slug' => 'withdrawals.settings', 'group' => 'withdrawals'],

            // Session Management
            ['name' => 'Xem sessions', 'slug' => 'sessions.view', 'group' => 'sessions'],
            ['name' => 'Xóa sessions', 'slug' => 'sessions.delete', 'group' => 'sessions'],

            // Message Management
            ['name' => 'Xem messages', 'slug' => 'messages.view', 'group' => 'messages'],
            ['name' => 'Xóa messages', 'slug' => 'messages.delete', 'group' => 'messages'],

            // Role & Permission Management
            ['name' => 'Xem vai trò', 'slug' => 'roles.view', 'group' => 'roles'],
            ['name' => 'Tạo vai trò', 'slug' => 'roles.create', 'group' => 'roles'],
            ['name' => 'Sửa vai trò', 'slug' => 'roles.edit', 'group' => 'roles'],
            ['name' => 'Xóa vai trò', 'slug' => 'roles.delete', 'group' => 'roles'],
            ['name' => 'Xem quyền', 'slug' => 'permissions.view', 'group' => 'permissions'],
            ['name' => 'Tạo quyền', 'slug' => 'permissions.create', 'group' => 'permissions'],
            ['name' => 'Sửa quyền', 'slug' => 'permissions.edit', 'group' => 'permissions'],
            ['name' => 'Xóa quyền', 'slug' => 'permissions.delete', 'group' => 'permissions'],

            // Dashboard
            ['name' => 'Xem dashboard', 'slug' => 'dashboard.view', 'group' => 'dashboard'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }

        // Create Roles
        $adminRole = Role::firstOrCreate(
            ['slug' => 'admin'],
            [
                'name' => 'Administrator',
                'description' => 'Quyền quản trị viên đầy đủ',
                'is_active' => true,
            ]
        );

        $moderatorRole = Role::firstOrCreate(
            ['slug' => 'moderator'],
            [
                'name' => 'Moderator',
                'description' => 'Quyền điều hành viên',
                'is_active' => true,
            ]
        );

        $userRole = Role::firstOrCreate(
            ['slug' => 'user'],
            [
                'name' => 'User',
                'description' => 'Người dùng thông thường',
                'is_active' => true,
            ]
        );

        // Assign all permissions to admin
        $adminRole->assignPermissions(Permission::pluck('id')->toArray());

        // Assign limited permissions to moderator
        $moderatorPermissions = Permission::whereIn('slug', [
            'users.view',
            'transactions.view',
            'transactions.approve',
            'transactions.reject',
            'withdrawals.view',
            'withdrawals.approve',
            'withdrawals.reject',
            'sessions.view',
            'messages.view',
            'dashboard.view',
        ])->pluck('id')->toArray();
        $moderatorRole->assignPermissions($moderatorPermissions);

        // User role has no admin permissions (only dashboard view)
        $userPermissions = Permission::whereIn('slug', [
            'dashboard.view',
        ])->pluck('id')->toArray();
        $userRole->assignPermissions($userPermissions);

        $this->command->info('✅ Đã tạo ' . count($permissions) . ' quyền và 3 vai trò mẫu!');
    }
}
