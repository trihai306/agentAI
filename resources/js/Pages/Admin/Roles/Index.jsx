import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import BaseTable from '../../../Components/Admin/BaseTable';
import FilterBar from '../../../Components/Admin/FilterBar';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import route from '../../../Utils/route';

export default function RolesIndex({ roles, filters: initialFilters }) {
    const [filters, setFilters] = useState(initialFilters || {});
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        router.get(
            route('admin.roles.index'),
            newFilters,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSort = (sortBy, sortOrder) => {
        handleFilterChange({ ...filters, sort_by: sortBy, sort_order: sortOrder });
    };

    const handleDelete = (role) => {
        setSelectedRole(role);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (selectedRole) {
            router.delete(route('admin.roles.destroy', selectedRole.id), {
                onSuccess: () => {
                    setShowDeleteDialog(false);
                    setSelectedRole(null);
                },
            });
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Tên',
            sortable: true,
        },
        {
            key: 'slug',
            label: 'Slug',
            sortable: true,
        },
        {
            key: 'description',
            label: 'Mô tả',
            sortable: false,
        },
        {
            key: 'is_active',
            label: 'Trạng thái',
            sortable: true,
            render: (value) => (
                <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                        value
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                >
                    {value ? 'Hoạt động' : 'Không hoạt động'}
                </span>
            ),
        },
        {
            key: 'users_count',
            label: 'Số người dùng',
            sortable: true,
            type: 'number',
        },
        {
            key: 'permissions_count',
            label: 'Số quyền',
            sortable: true,
            type: 'number',
        },
        {
            key: 'created_at',
            label: 'Ngày tạo',
            sortable: true,
            type: 'datetime',
        },
    ];

    const actions = [
        {
            label: 'Sửa',
            onClick: (row) => router.visit(route('admin.roles.edit', row.id)),
            variant: 'info',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                </svg>
            ),
        },
        {
            label: 'Xóa',
            onClick: handleDelete,
            variant: 'danger',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
            ),
        },
    ];

    const filterConfig = [
        {
            key: 'is_active',
            label: 'Trạng thái',
            type: 'select',
            options: [
                { value: '1', label: 'Hoạt động' },
                { value: '0', label: 'Không hoạt động' },
            ],
        },
    ];

    return (
        <AdminLayout title="Quản lý vai trò">
            <Head title="Quản lý vai trò" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Quản lý vai trò
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Quản lý các vai trò trong hệ thống
                        </p>
                    </div>
                    <Link
                        href={route('admin.roles.create')}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                        Thêm vai trò
                    </Link>
                </div>

                {/* Filters */}
                <FilterBar filters={filters} filterConfig={filterConfig} onFilterChange={handleFilterChange} />

                {/* Table */}
                <BaseTable
                    columns={columns}
                    data={roles.data || []}
                    pagination={roles}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSort={handleSort}
                    actions={actions}
                    searchPlaceholder="Tìm kiếm theo tên, slug, mô tả..."
                />

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    show={showDeleteDialog}
                    onClose={() => {
                        setShowDeleteDialog(false);
                        setSelectedRole(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Xác nhận xóa"
                    message={`Bạn có chắc chắn muốn xóa vai trò "${selectedRole?.name}"?`}
                    variant="danger"
                />
            </div>
        </AdminLayout>
    );
}

