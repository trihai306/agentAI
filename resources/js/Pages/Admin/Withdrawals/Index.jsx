import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import BaseTable from '../../../Components/Admin/BaseTable';
import FilterBar from '../../../Components/Admin/FilterBar';
import TransactionStatusBadge from '../../../Components/TransactionStatusBadge';
import ModalForm from '../../../Components/Admin/ModalForm';
import route from '../../../Utils/route';

export default function WithdrawalsIndex({ withdrawals, filters: initialFilters }) {
    const [filters, setFilters] = useState(initialFilters || {});
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        router.get(
            route('admin.withdrawals.index'),
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
        routerInstance.post(route('admin.withdrawals.approve', selectedTransaction.id), data, {
            onSuccess: () => {
                reset();
                setShowApproveModal(false);
                setSelectedTransaction(null);
            },
        });
    };

    const submitReject = (data, { router: routerInstance, reset }) => {
        routerInstance.post(route('admin.withdrawals.reject', selectedTransaction.id), data, {
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

    const actions = [
        {
            label: 'Duyệt',
            onClick: handleApprove,
            variant: 'success',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
            ),
        },
        {
            label: 'Từ chối',
            onClick: handleReject,
            variant: 'danger',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
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
        <AdminLayout title="Quản lý rút tiền">
            <Head title="Quản lý rút tiền" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Quản lý rút tiền
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Duyệt các yêu cầu rút tiền đang chờ
                        </p>
                    </div>
                    <Link
                        href={route('admin.withdrawals.settings')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Cài đặt
                    </Link>
                </div>

                {/* Filters */}
                <FilterBar filters={filters} filterConfig={filterConfig} onFilterChange={handleFilterChange} />

                {/* Table */}
                <BaseTable
                    columns={columns}
                    data={withdrawals.data || []}
                    pagination={withdrawals}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSort={handleSort}
                    actions={actions}
                    searchPlaceholder="Tìm kiếm theo mã tham chiếu, tên, email..."
                />

                {/* Approve Modal */}
                <ModalForm
                    show={showApproveModal}
                    onClose={() => {
                        setShowApproveModal(false);
                        setSelectedTransaction(null);
                    }}
                    title="Duyệt yêu cầu rút tiền"
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
                    title="Từ chối yêu cầu rút tiền"
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

