import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import BaseTable from '../../../Components/Admin/BaseTable';
import FilterBar from '../../../Components/Admin/FilterBar';
import StatsCard from '../../../Components/Admin/StatsCard';
import TransactionStatusBadge from '../../../Components/TransactionStatusBadge';
import ModalForm from '../../../Components/Admin/ModalForm';
import route from '../../../Utils/route';

export default function TransactionsIndex({ transactions, stats, filters: initialFilters }) {
    const [filters, setFilters] = useState(initialFilters || {});
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        router.get(
            route('admin.transactions.index'),
            newFilters,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSort = (sortBy, sortOrder) => {
        handleFilterChange({ ...filters, sort_by: sortBy, sort_order: sortOrder });
    };

    const handleApprove = (transaction) => {
        setSelectedTransaction(transaction);
        setShowApproveModal(true);
    };

    const handleReject = (transaction) => {
        setSelectedTransaction(transaction);
        setShowRejectModal(true);
    };

    const submitApprove = (data, { router: routerInstance, reset }) => {
        routerInstance.post(route('admin.transactions.approve', selectedTransaction.id), data, {
            onSuccess: () => {
                reset();
                setShowApproveModal(false);
                setSelectedTransaction(null);
            },
        });
    };

    const submitReject = (data, { router: routerInstance, reset }) => {
        routerInstance.post(route('admin.transactions.reject', selectedTransaction.id), data, {
            onSuccess: () => {
                reset();
                setShowRejectModal(false);
                setSelectedTransaction(null);
            },
        });
    };

    const columns = [
        {
            key: 'reference_code',
            label: 'Mã tham chiếu',
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
            key: 'type',
            label: 'Loại',
            sortable: true,
            render: (value) => (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    {value === 'deposit' ? 'Nạp tiền' : 'Rút tiền'}
                </span>
            ),
        },
        {
            key: 'amount',
            label: 'Số tiền',
            sortable: true,
            type: 'currency',
        },
        {
            key: 'status',
            label: 'Trạng thái',
            sortable: true,
            render: (value) => <TransactionStatusBadge status={value} />,
        },
        {
            key: 'payment_method',
            label: 'Phương thức',
            sortable: true,
        },
        {
            key: 'created_at',
            label: 'Ngày tạo',
            sortable: true,
            type: 'datetime',
        },
    ];

    const getRowActions = (row) => {
        const rowActions = [
            {
                label: 'Xem',
                onClick: () => router.visit(route('admin.transactions.show', row.id)),
                variant: 'info',
                icon: (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                    </svg>
                ),
            },
        ];
        if (row.status === 'pending') {
            if (row.type === 'deposit' || row.type === 'withdrawal') {
                rowActions.push({
                    label: 'Duyệt',
                    onClick: () => handleApprove(row),
                    variant: 'success',
                    icon: (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                    ),
                });
                rowActions.push({
                    label: 'Từ chối',
                    onClick: () => handleReject(row),
                    variant: 'danger',
                    icon: (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                    ),
                });
            }
        }
        return rowActions;
    };

    const filterConfig = [
        {
            key: 'type',
            label: 'Loại',
            type: 'select',
            options: [
                { value: 'deposit', label: 'Nạp tiền' },
                { value: 'withdrawal', label: 'Rút tiền' },
            ],
        },
        {
            key: 'status',
            label: 'Trạng thái',
            type: 'select',
            options: [
                { value: 'pending', label: 'Chờ duyệt' },
                { value: 'completed', label: 'Hoàn thành' },
                { value: 'failed', label: 'Thất bại' },
                { value: 'cancelled', label: 'Đã hủy' },
            ],
        },
        {
            key: 'payment_method',
            label: 'Phương thức',
            type: 'select',
            options: [
                { value: 'bank_transfer', label: 'Chuyển khoản' },
                { value: 'momo', label: 'MoMo' },
                { value: 'vnpay', label: 'VNPay' },
            ],
        },
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
        <AdminLayout title="Quản lý giao dịch">
            <Head title="Quản lý giao dịch" />
            <div className="space-y-6">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <StatsCard
                            title="Tổng nạp tiền"
                            value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.total_deposits || 0)}
                            color="green"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Tổng rút tiền"
                            value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.total_withdrawals || 0)}
                            color="red"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Nạp tiền chờ duyệt"
                            value={(stats.pending_deposits || 0).toLocaleString('vi-VN')}
                            color="yellow"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Rút tiền chờ duyệt"
                            value={(stats.pending_withdrawals || 0).toLocaleString('vi-VN')}
                            color="yellow"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
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
                    data={transactions.data || []}
                    pagination={transactions}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSort={handleSort}
                    actions={getRowActions}
                    searchPlaceholder="Tìm kiếm theo mã tham chiếu, tên, email..."
                />

                {/* Approve Modal */}
                <ModalForm
                    show={showApproveModal}
                    onClose={() => {
                        setShowApproveModal(false);
                        setSelectedTransaction(null);
                    }}
                    title="Duyệt giao dịch"
                    fields={[
                        {
                            name: 'reason',
                            label: 'Lý do (tùy chọn)',
                            type: 'textarea',
                            rows: 3,
                            placeholder: 'Nhập lý do duyệt...',
                        },
                    ]}
                    initialData={{ reason: '' }}
                    onSubmit={submitApprove}
                />

                {/* Reject Modal */}
                <ModalForm
                    show={showRejectModal}
                    onClose={() => {
                        setShowRejectModal(false);
                        setSelectedTransaction(null);
                    }}
                    title="Từ chối giao dịch"
                    fields={[
                        {
                            name: 'reason',
                            label: 'Lý do',
                            type: 'textarea',
                            rows: 3,
                            placeholder: 'Nhập lý do từ chối...',
                            required: true,
                        },
                    ]}
                    initialData={{ reason: '' }}
                    onSubmit={submitReject}
                />
            </div>
        </AdminLayout>
    );
}

