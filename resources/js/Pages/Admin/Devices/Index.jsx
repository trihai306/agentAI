import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import BaseTable from '../../../Components/Admin/BaseTable';
import axios from 'axios';
import route from '../../../Utils/route';

export default function DevicesIndex({ 
    devices, 
    stats: initialStats = null,
    filters: initialFilters = {} 
}) {
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState(initialFilters);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        router.get(
            route('admin.devices.index'),
            newFilters,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSort = (sortBy, sortOrder) => {
        handleFilterChange({ ...filters, sort_by: sortBy, sort_order: sortOrder });
    };

    const handleToggleActive = async (device) => {
        try {
            const response = await axios.post(route('admin.devices.toggle-active', device.id));
            if (response.data.success) {
                router.reload({ only: ['devices'] });
            }
        } catch (error) {
            console.error('Error toggling device:', error);
        }
    };

    const handleDelete = async (device) => {
        if (confirm(`Bạn có chắc chắn muốn xóa thiết bị "${device.name}"?`)) {
            router.delete(route('admin.devices.destroy', device.id), {
                preserveScroll: true,
            });
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
            key: 'screen_size',
            label: 'Màn hình',
            sortable: false,
            render: (value) => {
                if (!value || typeof value !== 'object') return '-';
                return `${value.width || '?'} × ${value.height || '?'}`;
            },
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
            key: 'last_seen_at',
            label: 'Lần cuối',
            sortable: true,
            type: 'datetime',
        },
        {
            key: 'udid',
            label: 'UDID',
            sortable: false,
            render: (value) => (
                <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                    {value || '-'}
                </span>
            ),
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

    const stats = initialStats || {
        total: 0,
        connected: 0,
        android: 0,
        ios: 0,
    };

    return (
        <AdminLayout title="Quản lý thiết bị">
            <Head title="Quản lý thiết bị" />
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng thiết bị</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total || 0}</p>
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đã kết nối</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.connected || 0}</p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Android</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.android || 0}</p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <span className="text-2xl">🤖</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">iOS</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.ios || 0}</p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <span className="text-2xl">🍎</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Quản lý thiết bị
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Quản lý các thiết bị đã đăng ký qua API
                        </p>
                    </div>
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
        </AdminLayout>
    );
}
