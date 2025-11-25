import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import UserLayout from '../../../Layouts/UserLayout';
import BaseTable from '../../../Components/Admin/BaseTable';
import StatsCard from '../../../Components/Admin/StatsCard';
import TransactionStatusBadge from '../../../Components/TransactionStatusBadge';
import route from '../../../Utils/route';

export default function UserTransactionsIndex({ transactions, stats, filters: initialFilters }) {
    const [filters, setFilters] = useState(initialFilters || {});

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        router.get(
            route('transactions.index'),
            newFilters,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSort = (sortBy, sortOrder) => {
        handleFilterChange({ ...filters, sort_by: sortBy, sort_order: sortOrder });
    };

    const columns = [
        {
            key: 'reference_code',
            label: 'Mã tham chiếu',
            sortable: true,
        },
        {
            key: 'type',
            label: 'Loại',
            sortable: true,
            render: (value) => {
                const typeLabels = {
                    'deposit': 'Nạp tiền',
                    'withdrawal': 'Rút tiền',
                    'purchase': 'Chi tiêu',
                    'refund': 'Hoàn tiền',
                };
                const typeColors = {
                    'deposit': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                    'withdrawal': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
                    'purchase': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                    'refund': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
                };
                return (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[value] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                        {typeLabels[value] || value}
                    </span>
                );
            },
        },
        {
            key: 'amount',
            label: 'Số tiền',
            sortable: true,
            type: 'currency',
            render: (value, row) => {
                const isNegative = row.type === 'withdrawal' || row.type === 'purchase';
                return (
                    <span className={`font-semibold ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {isNegative ? '-' : '+'}
                        {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                        }).format(Math.abs(value))}
                    </span>
                );
            },
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
            sortable: false,
            render: (value) => {
                const methods = {
                    'bank_transfer': 'Chuyển khoản',
                    'momo': 'MoMo',
                    'zalopay': 'ZaloPay',
                    'credit_card': 'Thẻ tín dụng',
                    'wallet': 'Ví nội bộ',
                };
                return <span className="text-sm text-gray-600 dark:text-gray-400">{methods[value] || value || '-'}</span>;
            },
        },
        {
            key: 'description',
            label: 'Mô tả',
            sortable: false,
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
            label: 'Xem chi tiết',
            onClick: (transaction) => {
                router.visit(route('transactions.show', transaction.id));
            },
            variant: 'info',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
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
                { value: '', label: 'Tất cả' },
                { value: 'deposit', label: 'Nạp tiền' },
                { value: 'withdrawal', label: 'Rút tiền' },
                { value: 'purchase', label: 'Chi tiêu' },
                { value: 'refund', label: 'Hoàn tiền' },
            ],
        },
        {
            key: 'status',
            label: 'Trạng thái',
            type: 'select',
            options: [
                { value: '', label: 'Tất cả' },
                { value: 'pending', label: 'Chờ duyệt' },
                { value: 'completed', label: 'Hoàn thành' },
                { value: 'failed', label: 'Thất bại' },
                { value: 'cancelled', label: 'Đã hủy' },
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
        <UserLayout title="Quản lý giao dịch">
            <Head title="Quản lý giao dịch" />
            <div className="space-y-6">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <StatsCard
                            title="Tổng nạp"
                            value={new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                            }).format(stats.total_deposit || 0)}
                            color="green"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Tổng rút"
                            value={new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                            }).format(stats.total_withdrawal || 0)}
                            color="orange"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Tổng chi tiêu"
                            value={new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                            }).format(stats.total_spent || 0)}
                            color="red"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Chờ duyệt"
                            value={(stats.pending || 0).toLocaleString('vi-VN')}
                            color="yellow"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                    </div>
                )}

                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Lịch sử giao dịch
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Xem và quản lý tất cả các giao dịch của bạn
                    </p>
                </div>

                {/* Table */}
                <BaseTable
                    columns={columns}
                    data={transactions?.data || []}
                    pagination={transactions}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSort={handleSort}
                    actions={actions}
                    searchable={true}
                    searchPlaceholder="Tìm kiếm theo mã tham chiếu, mô tả..."
                    filterConfig={filterConfig}
                    emptyMessage="Không có giao dịch nào"
                />
            </div>
        </UserLayout>
    );
}

