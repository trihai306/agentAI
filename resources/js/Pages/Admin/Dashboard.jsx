import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import StatsCard from '../../Components/Admin/StatsCard';
import axios from 'axios';

export default function Dashboard() {
    const [stats, setStats] = useState({
        sessions: 0,
        messages: 0,
        activeUsers: 0,
        transactions: {},
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [adminStats, transactionStats] = await Promise.all([
                    axios.get('/api/admin/stats'),
                    axios.get('/api/admin/transactions/stats'),
                ]);
                setStats({
                    sessions: adminStats.data.sessions || 0,
                    messages: adminStats.data.messages || 0,
                    activeUsers: adminStats.data.activeUsers || 0,
                    transactions: transactionStats.data || {},
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <AdminLayout title="Dashboard">
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Tổng quan
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Thống kê tổng quan về hệ thống
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Tổng Sessions"
                        value={loading ? '...' : stats.sessions.toLocaleString('vi-VN')}
                        color="blue"
                        icon={
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"></path>
                            </svg>
                        }
                    />
                    <StatsCard
                        title="Tổng Messages"
                        value={loading ? '...' : stats.messages.toLocaleString('vi-VN')}
                        color="green"
                        icon={
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                            </svg>
                        }
                    />
                    <StatsCard
                        title="Người dùng hoạt động"
                        value={loading ? '...' : stats.activeUsers.toLocaleString('vi-VN')}
                        color="purple"
                        icon={
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                            </svg>
                        }
                    />
                    <StatsCard
                        title="Tổng giao dịch"
                        value={loading ? '...' : (stats.transactions.total_transactions || 0).toLocaleString('vi-VN')}
                        color="indigo"
                        icon={
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path>
                            </svg>
                        }
                    />
                </div>

                {/* Transaction Stats */}
                {!loading && stats.transactions && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <StatsCard
                            title="Tổng nạp tiền"
                            value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.transactions.total_deposits || 0)}
                            color="green"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Tổng rút tiền"
                            value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.transactions.total_withdrawals || 0)}
                            color="red"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Nạp tiền chờ duyệt"
                            value={(stats.transactions.pending_deposits || 0).toLocaleString('vi-VN')}
                            color="yellow"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                        <StatsCard
                            title="Rút tiền chờ duyệt"
                            value={(stats.transactions.pending_withdrawals || 0).toLocaleString('vi-VN')}
                            color="yellow"
                            icon={
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                                </svg>
                            }
                        />
                    </div>
                )}

                {/* Quick Links */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <a
                        href="/admin/transactions"
                        className="block p-6 bg-white rounded-lg shadow hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-900">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Quản lý giao dịch
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Xem và quản lý tất cả giao dịch
                                </p>
                            </div>
                        </div>
                    </a>
                    <a
                        href="/admin/withdrawals"
                        className="block p-6 bg-white rounded-lg shadow hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                        <div className="flex items-center">
                            <div className="p-3 bg-red-100 rounded-lg dark:bg-red-900">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-300" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Yêu cầu rút tiền
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Duyệt các yêu cầu rút tiền
                                </p>
                            </div>
                        </div>
                    </a>
                    <a
                        href="/admin/packages"
                        className="block p-6 bg-white rounded-lg shadow hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg dark:bg-green-900">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Gói dịch vụ
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Quản lý các gói dịch vụ
                                </p>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        </AdminLayout>
    );
}

