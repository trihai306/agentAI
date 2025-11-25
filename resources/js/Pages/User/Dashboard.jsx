import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '../../Layouts/UserLayout';
import StatsCard from '../../Components/Admin/StatsCard';
import TransactionStatusBadge from '../../Components/TransactionStatusBadge';
import route from '../../Utils/route';

export default function UserDashboard({ deviceStats, transactionStats, walletBalance, recentTransactions }) {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(value || 0);
    };

    return (
        <UserLayout title="Dashboard">
            <Head title="Dashboard" />
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Tổng quan
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Thống kê tổng quan về tài khoản của bạn
                    </p>
                </div>

                {/* Wallet & Transaction Stats */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Số dư ví"
                        value={formatCurrency(walletBalance)}
                        color="blue"
                        icon={
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path>
                            </svg>
                        }
                    />
                    <StatsCard
                        title="Tổng nạp"
                        value={formatCurrency(transactionStats?.total_deposit || 0)}
                        color="green"
                        icon={
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path>
                            </svg>
                        }
                    />
                    <StatsCard
                        title="Tổng rút"
                        value={formatCurrency(transactionStats?.total_withdrawal || 0)}
                        color="orange"
                        icon={
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"></path>
                            </svg>
                        }
                    />
                    <StatsCard
                        title="Tổng chi tiêu"
                        value={formatCurrency(transactionStats?.total_spent || 0)}
                        color="red"
                        icon={
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                            </svg>
                        }
                    />
                </div>

                {/* Device Stats */}
                {deviceStats && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <StatsCard
                            title="Tổng thiết bị"
                            value={(deviceStats.total || 0).toLocaleString('vi-VN')}
                            color="blue"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Đã kết nối"
                            value={(deviceStats.connected || 0).toLocaleString('vi-VN')}
                            color="green"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Android"
                            value={(deviceStats.android || 0).toLocaleString('vi-VN')}
                            color="green"
                            icon={<span className="text-2xl">🤖</span>}
                        />
                        <StatsCard
                            title="iOS"
                            value={(deviceStats.ios || 0).toLocaleString('vi-VN')}
                            color="blue"
                            icon={<span className="text-2xl">🍎</span>}
                        />
                    </div>
                )}

                {/* Recent Transactions & Quick Actions */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Recent Transactions */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Giao dịch gần đây
                            </h3>
                            <Link
                                href={route('transactions.index')}
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Xem tất cả
                            </Link>
                        </div>
                        {recentTransactions && recentTransactions.length > 0 ? (
                            <div className="space-y-3">
                                {recentTransactions.map((transaction) => {
                                    const isNegative = transaction.type === 'withdrawal' || transaction.type === 'purchase';
                                    const typeLabels = {
                                        'deposit': 'Nạp tiền',
                                        'withdrawal': 'Rút tiền',
                                        'purchase': 'Chi tiêu',
                                        'refund': 'Hoàn tiền',
                                    };
                                    return (
                                        <div
                                            key={transaction.id}
                                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                            onClick={() => router.visit(route('transactions.show', transaction.id))}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {typeLabels[transaction.type] || transaction.type}
                                                    </span>
                                                    <TransactionStatusBadge status={transaction.status} />
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {transaction.reference_code}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-semibold ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                    {isNegative ? '-' : '+'}
                                                    {formatCurrency(Math.abs(transaction.amount))}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(transaction.created_at).toLocaleDateString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                Chưa có giao dịch nào
                            </p>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Thao tác nhanh
                        </h3>
                        <div className="space-y-3">
                            <Link
                                href={route('wallet.deposit')}
                                className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <svg className="w-5 h-5 text-green-600 dark:text-green-300" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path>
                                    </svg>
                                </div>
                                <div className="ml-4 flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Nạp tiền</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Nạp tiền vào ví của bạn</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <Link
                                href={route('devices.create')}
                                className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                                    </svg>
                                </div>
                                <div className="ml-4 flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Đăng ký thiết bị</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Thêm thiết bị mới vào tài khoản</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <Link
                                href={route('transactions.index')}
                                className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path>
                                    </svg>
                                </div>
                                <div className="ml-4 flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Lịch sử giao dịch</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Xem tất cả giao dịch</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <Link
                                href={route('devices.index')}
                                className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-300" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                                    </svg>
                                </div>
                                <div className="ml-4 flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Quản lý thiết bị</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Xem và quản lý thiết bị</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}

