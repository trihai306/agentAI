import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import BaseTable from '../../../Components/Admin/BaseTable';
import FilterBar from '../../../Components/Admin/FilterBar';
import StatsCard from '../../../Components/Admin/StatsCard';
import ModalForm from '../../../Components/Admin/ModalForm';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import { toast } from '../../../Utils/toast';
import axios from 'axios';
import route from '../../../Utils/route';

export default function UsersIndex({ users, roles, filters: initialFilters }) {
    const { flash } = usePage().props;
    const [filters, setFilters] = useState(initialFilters || {});
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [stats, setStats] = useState(null);

    // Show toast notifications from flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    useEffect(() => {
        axios.get('/api/admin/users/stats').then((response) => {
            setStats(response.data);
        });
    }, []);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        router.get(
            route('admin.users.index'),
            newFilters,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSort = (sortBy, sortOrder) => {
        handleFilterChange({ ...filters, sort_by: sortBy, sort_order: sortOrder });
    };

    const handleCreate = () => {
        setSelectedUser(null);
        setIsEditing(false);
        setShowModal(true);
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = (user) => {
        setSelectedUser(user);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (selectedUser) {
            router.delete(route('admin.users.destroy', selectedUser.id), {
                onSuccess: () => {
                    setShowDeleteDialog(false);
                    setSelectedUser(null);
                    toast.success('Đã xóa người dùng thành công');
                },
                onError: () => {
                    toast.error('Lỗi khi xóa người dùng');
                },
            });
        }
    };

    const submitForm = (data, { router: routerInstance, reset }) => {
        if (isEditing && selectedUser) {
            routerInstance.put(route('admin.users.update', selectedUser.id), data, {
                onSuccess: () => {
                    reset();
                    setShowModal(false);
                    setSelectedUser(null);
                    setIsEditing(false);
                    toast.success('Đã cập nhật người dùng thành công');
                },
                onError: () => {
                    toast.error('Lỗi khi cập nhật người dùng');
                },
            });
        } else {
            routerInstance.post(route('admin.users.store'), data, {
                onSuccess: () => {
                    reset();
                    setShowModal(false);
                    toast.success('Đã tạo người dùng thành công');
                },
                onError: () => {
                    toast.error('Lỗi khi tạo người dùng');
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
            key: 'email',
            label: 'Email',
            sortable: true,
        },
        {
            key: 'roles',
            label: 'Vai trò',
            sortable: false,
            render: (value) => (
                <div className="flex flex-wrap gap-1">
                    {value && value.length > 0 ? (
                        value.map((role) => (
                            <span
                                key={role.id}
                                className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            >
                                {role.name}
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                    )}
                </div>
            ),
        },
        {
            key: 'wallet_balance',
            label: 'Số dư ví',
            sortable: true,
            type: 'currency',
            render: (value) => (
                <span className="font-semibold text-green-600 dark:text-green-400">
                    {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                    }).format(value || 0)}
                </span>
            ),
        },
        {
            key: 'total_deposit',
            label: 'Tổng nạp',
            sortable: true,
            type: 'currency',
            render: (value) => (
                <span className="text-blue-600 dark:text-blue-400">
                    {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                    }).format(value || 0)}
                </span>
            ),
        },
        {
            key: 'total_withdrawal',
            label: 'Tổng rút',
            sortable: true,
            type: 'currency',
            render: (value) => (
                <span className="text-orange-600 dark:text-orange-400">
                    {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                    }).format(value || 0)}
                </span>
            ),
        },
        {
            key: 'total_spent',
            label: 'Tổng chi tiêu',
            sortable: true,
            type: 'currency',
            render: (value) => (
                <span className="text-red-600 dark:text-red-400">
                    {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                    }).format(value || 0)}
                </span>
            ),
        },
        {
            key: 'email_verified_at',
            label: 'Xác thực',
            sortable: true,
            render: (value) => (
                <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                        value
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                >
                    {value ? 'Đã xác thực' : 'Chưa xác thực'}
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

    const formFields = [
        {
            name: 'name',
            label: 'Tên',
            type: 'text',
            placeholder: 'Nhập tên',
            required: true,
        },
        {
            name: 'email',
            label: 'Email',
            type: 'email',
            placeholder: 'Nhập email',
            required: true,
        },
        {
            name: 'password',
            label: isEditing ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu',
            type: 'password',
            placeholder: 'Nhập mật khẩu',
            required: !isEditing,
        },
        {
            name: 'roles',
            label: 'Vai trò',
            type: 'custom',
            render: (data, setData, errors, processing) => (
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Vai trò
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 dark:border-gray-600">
                        {roles && roles.length > 0 ? (
                            roles.map((role) => (
                                <div key={role.id} className="flex items-center">
                                    <input
                                        id={`role-${role.id}`}
                                        type="checkbox"
                                        checked={(data.roles || []).includes(role.id)}
                                        onChange={(e) => {
                                            const currentRoles = data.roles || [];
                                            if (e.target.checked) {
                                                setData('roles', [...currentRoles, role.id]);
                                            } else {
                                                setData(
                                                    'roles',
                                                    currentRoles.filter((id) => id !== role.id)
                                                );
                                            }
                                        }}
                                        disabled={processing}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label
                                        htmlFor={`role-${role.id}`}
                                        className="ml-2 text-sm text-gray-900 dark:text-gray-300"
                                    >
                                        {role.name}
                                    </label>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Không có vai trò nào
                            </p>
                        )}
                    </div>
                    {errors.roles && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.roles}</p>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AdminLayout title="Quản lý người dùng">
            <Head title="Quản lý người dùng" />
            <div className="space-y-6">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <StatsCard
                            title="Tổng người dùng"
                            value={(stats.total || 0).toLocaleString('vi-VN')}
                            color="blue"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Đã xác thực"
                            value={(stats.verified || 0).toLocaleString('vi-VN')}
                            color="green"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Chưa xác thực"
                            value={(stats.unverified || 0).toLocaleString('vi-VN')}
                            color="yellow"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Mới (7 ngày)"
                            value={(stats.recent || 0).toLocaleString('vi-VN')}
                            color="purple"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Quản lý người dùng
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Quản lý tất cả người dùng trong hệ thống
                        </p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                        Thêm người dùng
                    </button>
                </div>

                {/* Table */}
                <BaseTable
                    columns={columns}
                    data={users.data || []}
                    pagination={users}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSort={handleSort}
                    actions={actions}
                    searchPlaceholder="Tìm kiếm theo tên, email..."
                />

                {/* Create/Edit Modal */}
                <ModalForm
                    show={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedUser(null);
                        setIsEditing(false);
                    }}
                    title={isEditing ? 'Sửa người dùng' : 'Thêm người dùng mới'}
                    fields={formFields}
                    size="lg"
                    initialData={
                        isEditing && selectedUser
                            ? {
                                  name: selectedUser.name || '',
                                  email: selectedUser.email || '',
                                  password: '',
                                  roles: selectedUser.roles?.map((r) => r.id) || [],
                              }
                            : {
                                  name: '',
                                  email: '',
                                  password: '',
                                  roles: [],
                              }
                    }
                    onSubmit={submitForm}
                />

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    show={showDeleteDialog}
                    onClose={() => {
                        setShowDeleteDialog(false);
                        setSelectedUser(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Xác nhận xóa"
                    message={`Bạn có chắc chắn muốn xóa người dùng "${selectedUser?.name}"?`}
                    variant="danger"
                />
            </div>
        </AdminLayout>
    );
}

