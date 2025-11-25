import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import BaseTable from '../../../Components/Admin/BaseTable';
import FilterBar from '../../../Components/Admin/FilterBar';
import ModalForm from '../../../Components/Admin/ModalForm';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import { toast } from '../../../Utils/toast';
import route from '../../../Utils/route';

export default function PackagesIndex({ packages, filters: initialFilters }) {
    const { flash } = usePage().props;
    const [filters, setFilters] = useState(initialFilters || {});
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Show toast notifications from flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        router.get(
            route('admin.packages.index'),
            newFilters,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSort = (sortBy, sortOrder) => {
        handleFilterChange({ ...filters, sort_by: sortBy, sort_order: sortOrder });
    };

    const handleCreate = () => {
        setSelectedPackage(null);
        setIsEditing(false);
        setShowModal(true);
    };

    const handleEdit = (pkg) => {
        setSelectedPackage(pkg);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = (pkg) => {
        setSelectedPackage(pkg);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (selectedPackage) {
            router.delete(route('admin.packages.destroy', selectedPackage.id), {
                onSuccess: () => {
                    setShowDeleteDialog(false);
                    setSelectedPackage(null);
                    toast.success('Đã xóa gói dịch vụ thành công');
                },
                onError: () => {
                    toast.error('Lỗi khi xóa gói dịch vụ');
                },
            });
        }
    };

    const submitForm = (data, { router: routerInstance, reset }) => {
        if (isEditing && selectedPackage) {
            routerInstance.put(route('admin.packages.update', selectedPackage.id), data, {
                onSuccess: () => {
                    reset();
                    setShowModal(false);
                    setSelectedPackage(null);
                    setIsEditing(false);
                },
            });
        } else {
            routerInstance.post(route('admin.packages.store'), data, {
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
            label: 'Tên gói',
            sortable: true,
        },
        {
            key: 'type',
            label: 'Loại',
            sortable: true,
            render: (value) => {
                const typeLabels = {
                    messages: 'Tin nhắn',
                    api_calls: 'API Calls',
                    storage: 'Lưu trữ',
                };
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {typeLabels[value] || value}
                    </span>
                );
            },
        },
        {
            key: 'quota',
            label: 'Hạn mức',
            sortable: true,
            type: 'number',
        },
        {
            key: 'price',
            label: 'Giá',
            sortable: true,
            type: 'currency',
        },
        {
            key: 'duration_days',
            label: 'Thời hạn (ngày)',
            sortable: true,
            type: 'number',
            render: (value) => value || 'Không giới hạn',
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
            key: 'created_at',
            label: 'Ngày tạo',
            sortable: true,
            type: 'datetime',
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
            key: 'type',
            label: 'Loại',
            type: 'select',
            options: [
                { value: 'messages', label: 'Tin nhắn' },
                { value: 'api_calls', label: 'API Calls' },
                { value: 'storage', label: 'Lưu trữ' },
            ],
        },
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

    const formFields = [
        {
            name: 'name',
            label: 'Tên gói',
            type: 'text',
            placeholder: 'Nhập tên gói',
            required: true,
        },
        {
            name: 'type',
            label: 'Loại',
            type: 'select',
            options: [
                { value: 'messages', label: 'Tin nhắn' },
                { value: 'api_calls', label: 'API Calls' },
                { value: 'storage', label: 'Lưu trữ' },
            ],
            required: true,
        },
        {
            name: 'quota',
            label: 'Hạn mức',
            type: 'number',
            placeholder: 'Nhập hạn mức',
            required: true,
        },
        {
            name: 'price',
            label: 'Giá (VND)',
            type: 'number',
            placeholder: 'Nhập giá',
            required: true,
        },
        {
            name: 'duration_days',
            label: 'Thời hạn (ngày)',
            type: 'number',
            placeholder: 'Để trống nếu không giới hạn',
        },
        {
            name: 'description',
            label: 'Mô tả',
            type: 'textarea',
            rows: 3,
            placeholder: 'Nhập mô tả...',
        },
        {
            name: 'is_active',
            label: 'Kích hoạt',
            type: 'checkbox',
        },
    ];

    return (
        <AdminLayout title="Quản lý gói dịch vụ">
            <Head title="Quản lý gói dịch vụ" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Quản lý gói dịch vụ
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Quản lý các gói dịch vụ trong hệ thống
                        </p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                        Thêm gói dịch vụ
                    </button>
                </div>

                {/* Filters */}
                <FilterBar filters={filters} filterConfig={filterConfig} onFilterChange={handleFilterChange} />

                {/* Table */}
                <BaseTable
                    columns={columns}
                    data={packages.data || []}
                    pagination={packages}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSort={handleSort}
                    actions={actions}
                    searchPlaceholder="Tìm kiếm theo tên, mô tả..."
                />

                {/* Create/Edit Modal */}
                <ModalForm
                    show={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedPackage(null);
                        setIsEditing(false);
                    }}
                    title={isEditing ? 'Sửa gói dịch vụ' : 'Thêm gói dịch vụ mới'}
                    fields={formFields}
                    size="lg"
                    initialData={
                        isEditing && selectedPackage
                            ? {
                                  name: selectedPackage.name || '',
                                  type: selectedPackage.type || '',
                                  quota: selectedPackage.quota || 0,
                                  price: selectedPackage.price || 0,
                                  duration_days: selectedPackage.duration_days || '',
                                  description: selectedPackage.description || '',
                                  is_active: selectedPackage.is_active !== undefined ? selectedPackage.is_active : true,
                              }
                            : {
                                  name: '',
                                  type: '',
                                  quota: 0,
                                  price: 0,
                                  duration_days: '',
                                  description: '',
                                  is_active: true,
                              }
                    }
                    onSubmit={submitForm}
                />

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    show={showDeleteDialog}
                    onClose={() => {
                        setShowDeleteDialog(false);
                        setSelectedPackage(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Xác nhận xóa"
                    message={`Bạn có chắc chắn muốn xóa gói dịch vụ "${selectedPackage?.name}"?`}
                    variant="danger"
                />
            </div>
        </AdminLayout>
    );
}

