import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import TransactionStatusBadge from '../../../Components/TransactionStatusBadge';
import ModalForm from '../../../Components/Admin/ModalForm';
import route from '../../../Utils/route';

export default function TransactionsShow({ transaction }) {
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);

    const submitApprove = (data, { router: routerInstance, reset }) => {
        routerInstance.post(route('admin.transactions.approve', transaction.id), data, {
            onSuccess: () => {
                reset();
                setShowApproveModal(false);
            },
        });
    };

    const submitReject = (data, { router: routerInstance, reset }) => {
        routerInstance.post(route('admin.transactions.reject', transaction.id), data, {
            onSuccess: () => {
                reset();
                setShowRejectModal(false);
            },
        });
    };

    return (
        <AdminLayout title="Chi tiết giao dịch">
            <Head title="Chi tiết giao dịch" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Chi tiết giao dịch
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Mã tham chiếu: {transaction.reference_code}
                        </p>
                    </div>
                    <Link
                        href={route('admin.transactions.index')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Quay lại
                    </Link>
                </div>

                {/* Transaction Details */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Basic Info */}
                    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Thông tin cơ bản
                        </h3>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Mã tham chiếu
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {transaction.reference_code}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Loại giao dịch
                                </dt>
                                <dd className="mt-1">
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                        {transaction.type === 'deposit' ? 'Nạp tiền' : 'Rút tiền'}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Số tiền
                                </dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                    {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND',
                                    }).format(transaction.amount)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Trạng thái
                                </dt>
                                <dd className="mt-1">
                                    <TransactionStatusBadge status={transaction.status} />
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Phương thức thanh toán
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {transaction.payment_method || '-'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Ngày tạo
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {new Date(transaction.created_at).toLocaleString('vi-VN')}
                                </dd>
                            </div>
                            {transaction.updated_at && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Ngày cập nhật
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {new Date(transaction.updated_at).toLocaleString('vi-VN')}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* User Info */}
                    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Thông tin người dùng
                        </h3>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Tên
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {transaction.user?.name || '-'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Email
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {transaction.user?.email || '-'}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Description */}
                    {transaction.description && (
                        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 lg:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Mô tả
                            </h3>
                            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                {transaction.description}
                            </p>
                        </div>
                    )}

                    {/* Approver Info */}
                    {transaction.approver && (
                        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 lg:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Thông tin người duyệt
                            </h3>
                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Tên
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {transaction.approver.name || '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Email
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {transaction.approver.email || '-'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {transaction.status === 'pending' && (
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setShowApproveModal(true)}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                        >
                            Duyệt giao dịch
                        </button>
                        <button
                            onClick={() => setShowRejectModal(true)}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            Từ chối giao dịch
                        </button>
                    </div>
                )}

                {/* Approve Modal */}
                <ModalForm
                    show={showApproveModal}
                    onClose={() => setShowApproveModal(false)}
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
                    onClose={() => setShowRejectModal(false)}
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

