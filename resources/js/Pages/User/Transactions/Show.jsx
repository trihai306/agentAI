import { Head, Link } from '@inertiajs/react';
import UserLayout from '../../../Layouts/UserLayout';
import TransactionStatusBadge from '../../../Components/TransactionStatusBadge';
import route from '../../../Utils/route';

export default function UserTransactionShow({ transaction }) {
    const typeLabels = {
        'deposit': 'Nạp tiền',
        'withdrawal': 'Rút tiền',
        'purchase': 'Chi tiêu',
        'refund': 'Hoàn tiền',
    };

    const paymentMethods = {
        'bank_transfer': 'Chuyển khoản ngân hàng',
        'momo': 'MoMo',
        'zalopay': 'ZaloPay',
        'credit_card': 'Thẻ tín dụng',
        'wallet': 'Ví nội bộ',
    };

    return (
        <UserLayout title="Chi tiết giao dịch">
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
                        href={route('transactions.index')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Quay lại
                    </Link>
                </div>

                {/* Transaction Details */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Loại giao dịch</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                    {typeLabels[transaction.type] || transaction.type}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Số tiền</dt>
                                <dd className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                    {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND',
                                    }).format(transaction.amount)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Trạng thái</dt>
                                <dd className="mt-1">
                                    <TransactionStatusBadge status={transaction.status} />
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phương thức thanh toán</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {paymentMethods[transaction.payment_method] || transaction.payment_method || '-'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Ngày tạo</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {new Date(transaction.created_at).toLocaleString('vi-VN')}
                                </dd>
                            </div>
                            {transaction.approved_at && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Ngày duyệt</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {new Date(transaction.approved_at).toLocaleString('vi-VN')}
                                    </dd>
                                </div>
                            )}
                        </div>

                        {transaction.description && (
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Mô tả</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {transaction.description}
                                </dd>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}

