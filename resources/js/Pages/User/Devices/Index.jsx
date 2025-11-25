import { Head, router, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import UserLayout from '../../../Layouts/UserLayout';
import BaseTable from '../../../Components/Admin/BaseTable';
import StatsCard from '../../../Components/Admin/StatsCard';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import useConfirmDialog from '../../../Hooks/useConfirmDialog';
import route from '../../../Utils/route';
import { toast } from '../../../Utils/toast';
import axios from 'axios';

export default function UserDevicesIndex({ devices, stats, filters: initialFilters, token }) {
    const { flash } = usePage().props;
    const [filters, setFilters] = useState(initialFilters || {});
    const [copied, setCopied] = useState(false);
    const { confirmDialog, hideDialog, dialogProps } = useConfirmDialog();

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
            route('devices.index'),
            newFilters,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSort = (sortBy, sortOrder) => {
        handleFilterChange({ ...filters, sort_by: sortBy, sort_order: sortOrder });
    };

    const handleToggleActive = async (device) => {
        confirmDialog({
            title: device.is_active ? 'Tạm dừng thiết bị' : 'Kích hoạt thiết bị',
            message: `Bạn có chắc chắn muốn ${device.is_active ? 'tạm dừng' : 'kích hoạt'} thiết bị "${device.name}"?`,
            variant: 'warning',
            confirmLabel: device.is_active ? 'Tạm dừng' : 'Kích hoạt',
            cancelLabel: 'Hủy',
            onConfirm: async () => {
        try {
            const response = await axios.post(route('devices.toggle-active', device.id));
            if (response.data.success) {
                        toast.success(`Đã ${device.is_active ? 'tạm dừng' : 'kích hoạt'} thiết bị thành công`);
                router.reload({ only: ['devices'] });
                    } else {
                        toast.error('Lỗi khi thay đổi trạng thái thiết bị');
            }
        } catch (error) {
            console.error('Error toggling device:', error);
                    toast.error('Lỗi khi thay đổi trạng thái thiết bị');
        }
            },
        });
    };

    const handleDelete = async (device) => {
        confirmDialog({
            title: 'Xóa thiết bị',
            message: `Bạn có chắc chắn muốn xóa thiết bị "${device.name}"?`,
            description: 'Hành động này không thể hoàn tác.',
            variant: 'danger',
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            onConfirm: () => {
            router.delete(route('devices.destroy', device.id), {
                preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Đã xóa thiết bị thành công');
                    },
                    onError: () => {
                        toast.error('Lỗi khi xóa thiết bị');
                    },
            });
            },
        });
    };

    const handleCopyToken = async () => {
        if (token) {
            try {
                await navigator.clipboard.writeText(token);
                setCopied(true);
                toast.success('Đã copy token vào clipboard');
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy token:', err);
                toast.error('Lỗi khi copy token');
            }
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Tên thiết bị',
            sortable: true,
        },
        {
            key: 'model',
            label: 'Model',
            sortable: true,
        },
        {
            key: 'platform',
            label: 'Nền tảng',
            sortable: true,
            render: (value) => {
                const platform = value?.toLowerCase() || 'unknown';
                const isAndroid = platform === 'android';
                const isIOS = platform === 'ios';

                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md ${
                        isAndroid
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : isIOS
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                        {isAndroid ? '🤖 Android' : isIOS ? '🍎 iOS' : 'Unknown'}
                    </span>
                );
            },
        },
        {
            key: 'version',
            label: 'Phiên bản',
            sortable: true,
        },
        {
            key: 'status',
            label: 'Trạng thái',
            sortable: true,
            render: (value) => {
                const isConnected = value === 'device';
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md ${
                        isConnected
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                        <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
                            isConnected ? 'bg-green-500' : 'bg-gray-400'
                        }`}></span>
                        {isConnected ? 'Đã kết nối' : 'Ngắt kết nối'}
                    </span>
                );
            },
        },
        {
            key: 'is_active',
            label: 'Hoạt động',
            sortable: true,
            render: (value) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    value
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                    {value ? 'Đang hoạt động' : 'Tạm dừng'}
                </span>
            ),
        },
        {
            key: 'last_seen_at',
            label: 'Lần cuối',
            sortable: true,
            type: 'datetime',
        },
    ];

    const actions = [
        {
            label: 'Bật/Tắt',
            onClick: handleToggleActive,
            variant: 'info',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
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

    return (
        <UserLayout title="Quản lý thiết bị">
            <Head title="Quản lý thiết bị" />
            <div className="space-y-6">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <StatsCard
                            title="Tổng thiết bị"
                            value={(stats.total || 0).toLocaleString('vi-VN')}
                            color="blue"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Đã kết nối"
                            value={(stats.connected || 0).toLocaleString('vi-VN')}
                            color="green"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Android"
                            value={(stats.android || 0).toLocaleString('vi-VN')}
                            color="green"
                            icon={<span className="text-2xl">🤖</span>}
                        />
                        <StatsCard
                            title="iOS"
                            value={(stats.ios || 0).toLocaleString('vi-VN')}
                            color="blue"
                            icon={<span className="text-2xl">🍎</span>}
                        />
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Quản lý thiết bị
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Quản lý các thiết bị đã đăng ký của bạn
                        </p>
                    </div>
                    <button
                        onClick={handleCopyToken}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                    >
                        {copied ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Đã copy!</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Copy Token</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Table */}
                <BaseTable
                    columns={columns}
                    data={devices?.data || []}
                    pagination={devices}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSort={handleSort}
                    actions={actions}
                    searchable={true}
                    searchPlaceholder="Tìm kiếm theo tên, model, UDID..."
                    emptyMessage="Không có thiết bị nào"
                />
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogProps} />
        </UserLayout>
    );
}

