import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '../../Layouts/UserLayout';
import route from '../../Utils/route';
import TransactionStatusBadge from '../../Components/TransactionStatusBadge';

export default function WalletIndex({ wallet, recentTransactions }) {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(value || 0);
    };

    const getTransactionTypeLabel = (type) => {
        const labels = {
            'deposit': 'Nạp tiền',
            'withdrawal': 'Rút tiền',
            'purchase': 'Chi tiêu',
            'refund': 'Hoàn tiền',
        };
        return labels[type] || type;
    };

    const getTransactionTypeColor = (type) => {
        const colors = {
            'deposit': 'text-green-600 dark:text-green-400',
            'withdrawal': 'text-orange-600 dark:text-orange-400',
            'purchase': 'text-red-600 dark:text-red-400',
            'refund': 'text-blue-600 dark:text-blue-400',
        };
        return colors[type] || 'text-gray-600 dark:text-gray-400';
    };

    return (
        <UserLayout title="Ví tiền">
            <Head title="Ví tiền" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Ví tiền của tôi
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Quản lý số dư và giao dịch của bạn
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link
                            href={route('wallet.deposit')}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Nạp tiền</span>
                        </Link>
                        <Link
                            href={route('wallet.withdraw')}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                            <span>Rút tiền</span>
                        </Link>
                    </div>
                </div>

                {/* Balance Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-900 rounded-3xl shadow-2xl p-8 text-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-blue-100 text-sm font-medium mb-1">Số dư hiện tại</p>
                                <h3 className="text-5xl font-bold mb-2">
                                    {formatCurrency(wallet?.balance || 0)}
                                </h3>
                                <p className="text-blue-100 text-sm">
                                    {wallet?.currency || 'VND'}
                                </p>
                            </div>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m7 4V9a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-6">
                            <Link
                                href={route('wallet.deposit')}
                                className="flex-1 px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-center font-semibold transition-all duration-200 hover:scale-105"
                            >
                                Nạp tiền
                            </Link>
                            <Link
                                href={route('wallet.withdraw')}
                                className="flex-1 px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-center font-semibold transition-all duration-200 hover:scale-105"
                            >
                                Rút tiền
                            </Link>
                            <Link
                                href={route('wallet.history')}
                                className="flex-1 px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-center font-semibold transition-all duration-200 hover:scale-105"
                            >
                                Lịch sử
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tổng nạp</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(
                                        recentTransactions
                                            ?.filter(t => t.type === 'deposit' && t.status === 'completed')
                                            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0
                                    )}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tổng rút</p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                    {formatCurrency(
                                        recentTransactions
                                            ?.filter(t => t.type === 'withdrawal' && t.status === 'completed')
                                            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0
                                    )}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Giao dịch gần đây</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {recentTransactions?.length || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Giao dịch gần đây
                        </h3>
                        <Link
                            href={route('wallet.history')}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                            Xem tất cả
                        </Link>
                    </div>
                    {recentTransactions && recentTransactions.length > 0 ? (
                        <div className="space-y-3">
                            {recentTransactions.map((transaction) => {
                                const isNegative = transaction.type === 'withdrawal' || transaction.type === 'purchase';
                                return (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border border-gray-100 dark:border-gray-700"
                                        onClick={() => router.visit(route('transactions.show', transaction.id))}
                                    >
                                        <div className="flex items-center space-x-4 flex-1">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                transaction.type === 'deposit' ? 'bg-green-100 dark:bg-green-900/30' :
                                                transaction.type === 'withdrawal' ? 'bg-orange-100 dark:bg-orange-900/30' :
                                                transaction.type === 'purchase' ? 'bg-red-100 dark:bg-red-900/30' :
                                                'bg-blue-100 dark:bg-blue-900/30'
                                            }`}>
                                                {transaction.type === 'deposit' ? (
                                                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                ) : transaction.type === 'withdrawal' ? (
                                                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                                                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path>
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {getTransactionTypeLabel(transaction.type)}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {transaction.reference_code}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                    {new Date(transaction.created_at).toLocaleDateString('vi-VN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${getTransactionTypeColor(transaction.type)}`}>
                                                {isNegative ? '-' : '+'}
                                                {formatCurrency(Math.abs(transaction.amount))}
                                            </p>
                                            <div className="mt-1">
                                                <TransactionStatusBadge status={transaction.status} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path>
                            </svg>
                            <p className="mt-4 text-gray-500 dark:text-gray-400">Chưa có giao dịch nào</p>
                        </div>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}

