import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import BaseTable from '../../../Components/Admin/BaseTable';
import FilterBar from '../../../Components/Admin/FilterBar';
import StatsCard from '../../../Components/Admin/StatsCard';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import route from '../../../Utils/route';

export default function SessionsIndex({ sessions, stats, filters: initialFilters }) {
    const [filters, setFilters] = useState(initialFilters || {});
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        router.get(
            route('admin.sessions.index'),
            newFilters,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSort = (sortBy, sortOrder) => {
        handleFilterChange({ ...filters, sort_by: sortBy, sort_order: sortOrder });
    };

    const handleDelete = (session) => {
        setSelectedSession(session);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (selectedSession) {
            router.delete(route('admin.sessions.destroy', selectedSession.id), {
                onSuccess: () => {
                    setShowDeleteDialog(false);
                    setSelectedSession(null);
                },
            });
        }
    };

    const columns = [
        {
            key: 'session_id',
            label: 'Session ID',
            sortable: true,
            render: (value) => (
                <span className="font-mono text-sm">{value || '-'}</span>
            ),
        },
        {
            key: 'name',
            label: 'Tên',
            sortable: true,
        },
        {
            key: 'user',
            label: 'Người dùng',
            sortable: false,
            render: (value) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {value?.name || '-'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {value?.email || '-'}
                    </div>
                </div>
            ),
        },
        {
            key: 'messages_count',
            label: 'Số tin nhắn',
            sortable: true,
            type: 'number',
        },
        {
            key: 'last_message_at',
            label: 'Tin nhắn cuối',
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
            label: 'Xem',
            onClick: (row) => router.visit(route('admin.sessions.show', row.id)),
            variant: 'info',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
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
            key: 'date_from',
            label: 'Từ ngày',
            type: 'date',
        },
        {
            key: 'date_to',
            label: 'Đến ngày',
            type: 'date',
        },
    ];

    return (
        <AdminLayout title="Quản lý sessions">
            <Head title="Quản lý sessions" />
            <div className="space-y-6">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <StatsCard
                            title="Tổng sessions"
                            value={(stats.total_sessions || 0).toLocaleString('vi-VN')}
                            color="blue"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Sessions hôm nay"
                            value={(stats.today_sessions || 0).toLocaleString('vi-VN')}
                            color="green"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Sessions hoạt động"
                            value={(stats.active_sessions || 0).toLocaleString('vi-VN')}
                            color="purple"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                    </div>
                )}

                {/* Filters */}
                <FilterBar filters={filters} filterConfig={filterConfig} onFilterChange={handleFilterChange} />

                {/* Table */}
                <BaseTable
                    columns={columns}
                    data={sessions.data || []}
                    pagination={sessions}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSort={handleSort}
                    actions={actions}
                    searchPlaceholder="Tìm kiếm theo tên, session ID, tên người dùng, email..."
                />

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    show={showDeleteDialog}
                    onClose={() => {
                        setShowDeleteDialog(false);
                        setSelectedSession(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Xác nhận xóa"
                    message={`Bạn có chắc chắn muốn xóa session "${selectedSession?.name}"? Tất cả tin nhắn trong session này cũng sẽ bị xóa.`}
                    variant="danger"
                />
            </div>
        </AdminLayout>
    );
}

