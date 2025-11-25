import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import BaseTable from '../../../Components/Admin/BaseTable';
import FilterBar from '../../../Components/Admin/FilterBar';
import ModalForm from '../../../Components/Admin/ModalForm';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import route from '../../../Utils/route';

export default function PermissionsIndex({ permissions, groups, filters: initialFilters }) {
    const [filters, setFilters] = useState(initialFilters || {});
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedPermission, setSelectedPermission] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        router.get(
            route('admin.permissions.index'),
            newFilters,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSort = (sortBy, sortOrder) => {
        handleFilterChange({ ...filters, sort_by: sortBy, sort_order: sortOrder });
    };

    const handleCreate = () => {
        setSelectedPermission(null);
        setIsEditing(false);
        setShowModal(true);
    };

    const handleEdit = (permission) => {
        setSelectedPermission(permission);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = (permission) => {
        setSelectedPermission(permission);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (selectedPermission) {
            router.delete(route('admin.permissions.destroy', selectedPermission.id), {
                onSuccess: () => {
                    setShowDeleteDialog(false);
                    setSelectedPermission(null);
                },
            });
        }
    };

    const submitForm = (data, { router: routerInstance, reset }) => {
        if (isEditing && selectedPermission) {
            routerInstance.put(route('admin.permissions.update', selectedPermission.id), data, {
                onSuccess: () => {
                    reset();
                    setShowModal(false);
                    setSelectedPermission(null);
                    setIsEditing(false);
                },
            });
        } else {
            routerInstance.post(route('admin.permissions.store'), data, {
                onSuccess: () => {
                    reset();
                    setShowModal(false);
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
            key: 'group',
            label: 'Nhóm',
            sortable: true,
        },
        {
            key: 'description',
            label: 'Mô tả',
            sortable: false,
        },
        {
            key: 'roles_count',
            label: 'Số vai trò',
            sortable: true,
            type: 'number',
        },
    ];

    const actions = [
        {
            label: 'Sửa',
            onClick: handleEdit,
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
            key: 'group',
            label: 'Nhóm',
            type: 'select',
            options: groups?.map((group) => ({ value: group, label: group })) || [],
        },
    ];

    const formFields = [
        {
            name: 'name',
            label: 'Tên quyền',
            type: 'text',
            placeholder: 'Nhập tên quyền',
            required: true,
        },
        {
            name: 'slug',
            label: 'Slug',
            type: 'text',
            placeholder: 'Tự động tạo từ tên nếu để trống',
            help: 'Slug sẽ được tạo tự động từ tên nếu để trống',
        },
        {
            name: 'group',
            label: 'Nhóm',
            type: 'select',
            options: [
                { value: '', label: 'Chọn nhóm' },
                ...(groups?.map((group) => ({ value: group, label: group })) || []),
            ],
            placeholder: 'Chọn nhóm',
        },
        {
            name: 'description',
            label: 'Mô tả',
            type: 'textarea',
            rows: 3,
            placeholder: 'Nhập mô tả...',
        },
    ];

    return (
        <AdminLayout title="Quản lý quyền">
            <Head title="Quản lý quyền" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Quản lý quyền
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Quản lý các quyền trong hệ thống
                        </p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                        Thêm quyền
                    </button>
                </div>

                {/* Filters */}
                <FilterBar filters={filters} filterConfig={filterConfig} onFilterChange={handleFilterChange} />

                {/* Table */}
                <BaseTable
                    columns={columns}
                    data={permissions.data || []}
                    pagination={permissions}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSort={handleSort}
                    actions={actions}
                    searchPlaceholder="Tìm kiếm theo tên, slug, mô tả..."
                />

                {/* Create/Edit Modal */}
                <ModalForm
                    show={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedPermission(null);
                        setIsEditing(false);
                    }}
                    title={isEditing ? 'Sửa quyền' : 'Thêm quyền mới'}
                    fields={formFields}
                    initialData={
                        isEditing && selectedPermission
                            ? {
                                  name: selectedPermission.name || '',
                                  slug: selectedPermission.slug || '',
                                  group: selectedPermission.group || '',
                                  description: selectedPermission.description || '',
                              }
                            : {
                                  name: '',
                                  slug: '',
                                  group: '',
                                  description: '',
                              }
                    }
                    onSubmit={submitForm}
                />

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    show={showDeleteDialog}
                    onClose={() => {
                        setShowDeleteDialog(false);
                        setSelectedPermission(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Xác nhận xóa"
                    message={`Bạn có chắc chắn muốn xóa quyền "${selectedPermission?.name}"?`}
                    variant="danger"
                />
            </div>
        </AdminLayout>
    );
}

