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

export default function UserWorkflowsIndex({ workflows, categories, filters: initialFilters }) {
    const { flash } = usePage().props;
    const [filters, setFilters] = useState(initialFilters || {});
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
            route('workflows.index'),
            newFilters,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSort = (sortBy, sortOrder) => {
        handleFilterChange({ ...filters, sort_by: sortBy, sort_order: sortOrder });
    };

    const handleDelete = async (workflow) => {
        confirmDialog({
            title: 'Xóa workflow',
            message: `Bạn có chắc chắn muốn xóa workflow "${workflow.name}"?`,
            description: 'Hành động này không thể hoàn tác.',
            variant: 'danger',
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            onConfirm: () => {
            router.delete(route('workflows.destroy', workflow.id), {
                preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Đã xóa workflow thành công');
                    },
                    onError: () => {
                        toast.error('Lỗi khi xóa workflow');
                    },
            });
            },
        });
    };

    const handleDuplicate = async (workflow) => {
        try {
            const response = await axios.post(route('workflows.duplicate', workflow.id));
            if (response.data.success) {
                toast.success('Đã sao chép workflow thành công');
                router.reload();
            } else {
                toast.error('Lỗi khi sao chép workflow');
            }
        } catch (error) {
            console.error('Error duplicating workflow:', error);
            toast.error('Lỗi khi sao chép workflow');
        }
    };

    const handleToggleActive = async (workflow) => {
        try {
            const response = await axios.put(route('workflows.update', workflow.id), {
                is_active: !workflow.is_active,
            });
            if (response.data.success) {
                router.reload({ only: ['workflows'] });
            }
        } catch (error) {
            console.error('Error toggling workflow:', error);
        }
    };

    const handleTogglePublic = async (workflow) => {
        try {
            const response = await axios.put(route('workflows.update', workflow.id), {
                is_public: !workflow.is_public,
            });
            if (response.data.success) {
                router.reload({ only: ['workflows'] });
            }
        } catch (error) {
            console.error('Error toggling public:', error);
        }
    };

    // Calculate stats
    const stats = {
        total: workflows?.total || 0,
        active: workflows?.data?.filter(w => w.is_active).length || 0,
        public: workflows?.data?.filter(w => w.is_public).length || 0,
        totalNodes: workflows?.data?.reduce((sum, w) => sum + (w.workflow_nodes?.length || 0), 0) || 0,
    };

    const columns = [
        {
            key: 'name',
            label: 'Tên workflow',
            sortable: true,
            render: (value, row) => (
                <Link
                    href={route('workflows.show', row.id)}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                    {value || 'Workflow không tên'}
                </Link>
            ),
        },
        {
            key: 'description',
            label: 'Mô tả',
            render: (value) => (
                <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {value || '-'}
                </span>
            ),
        },
        {
            key: 'category',
            label: 'Danh mục',
            sortable: true,
            render: (value) => (
                value ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {value}
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            ),
        },
        {
            key: 'workflow_nodes',
            label: 'Số nodes',
            render: (value) => (
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {value?.length || 0}
                </span>
            ),
        },
        {
            key: 'usage_count',
            label: 'Sử dụng',
            sortable: true,
            render: (value) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {value || 0} lần
                </span>
            ),
        },
        {
            key: 'is_active',
            label: 'Trạng thái',
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
            key: 'is_public',
            label: 'Công khai',
            sortable: true,
            render: (value) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    value
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                    {value ? 'Công khai' : 'Riêng tư'}
                </span>
            ),
        },
        {
            key: 'last_used_at',
            label: 'Lần cuối',
            sortable: true,
            type: 'datetime',
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
            label: 'Sao chép',
            onClick: handleDuplicate,
            variant: 'info',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
        <UserLayout title="Quản lý Workflow">
            <Head title="Quản lý Workflow" />
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Tổng workflow"
                        value={(stats.total || 0).toLocaleString('vi-VN')}
                        color="blue"
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        }
                    />
                    <StatsCard
                        title="Đang hoạt động"
                        value={(stats.active || 0).toLocaleString('vi-VN')}
                        color="green"
                        icon={
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                            </svg>
                        }
                    />
                    <StatsCard
                        title="Công khai"
                        value={(stats.public || 0).toLocaleString('vi-VN')}
                        color="purple"
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        }
                    />
                    <StatsCard
                        title="Tổng nodes"
                        value={(stats.totalNodes || 0).toLocaleString('vi-VN')}
                        color="indigo"
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                        }
                    />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Quản lý Workflow
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Quản lý các workflow đã tạo từ AI chat
                        </p>
                    </div>
                    <Link
                        href={route('chat.index')}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Chuyển sang Chat</span>
                    </Link>
                </div>

                {/* Table */}
                <BaseTable
                    columns={columns}
                    data={workflows?.data || []}
                    pagination={workflows}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSort={handleSort}
                    actions={actions}
                    searchable={true}
                    searchPlaceholder="Tìm kiếm theo tên, mô tả..."
                    emptyMessage="Không có workflow nào"
                />
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogProps} />
        </UserLayout>
    );
}

