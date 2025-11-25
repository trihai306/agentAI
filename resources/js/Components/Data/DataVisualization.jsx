import { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import route from '../../Utils/route';

export default function DataVisualization({ collections = [], statistics = null }) {
    const chartData = useMemo(() => {
        if (!collections?.data) return null;

        // Group by type
        const byType = collections.data.reduce((acc, collection) => {
            const type = collection.type || 'custom';
            if (!acc[type]) {
                acc[type] = { count: 0, items: 0 };
            }
            acc[type].count += 1;
            acc[type].items += collection.item_count || 0;
            return acc;
        }, {});

        // Group by status
        const byStatus = collections.data.reduce((acc, collection) => {
            const status = collection.is_active ? 'active' : 'inactive';
            if (!acc[status]) {
                acc[status] = 0;
            }
            acc[status] += 1;
            return acc;
        }, {});

        // Recent activity (last 7 days)
        const recentActivity = collections.data
            .filter(c => {
                if (!c.last_used_at) return false;
                const daysDiff = (new Date() - new Date(c.last_used_at)) / (1000 * 60 * 60 * 24);
                return daysDiff <= 7;
            })
            .length;

        return {
            byType,
            byStatus,
            recentActivity,
            total: collections.data.length
        };
    }, [collections]);

    const getTypeConfig = (type) => {
        const configs = {
            accounts: { label: 'Tài khoản', icon: '👤', color: 'blue' },
            comments: { label: 'Bình luận', icon: '💬', color: 'green' },
            posts: { label: 'Bài viết', icon: '📝', color: 'purple' },
            products: { label: 'Sản phẩm', icon: '🛍️', color: 'orange' },
            custom: { label: 'Tùy chỉnh', icon: '📦', color: 'gray' },
        };
        return configs[type] || configs.custom;
    };

    if (!chartData) {
        return null;
    }

    const typeEntries = Object.entries(chartData.byType);
    const maxTypeCount = Math.max(...typeEntries.map(([_, data]) => data.count), 1);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Type Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Phân bố theo loại</span>
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {typeEntries.length} loại
                    </span>
                </div>
                <div className="space-y-4">
                    {typeEntries.map(([type, data]) => {
                        const config = getTypeConfig(type);
                        const percentage = (data.count / maxTypeCount) * 100;

                        const colorClasses = {
                            blue: 'bg-blue-500',
                            green: 'bg-green-500',
                            purple: 'bg-purple-500',
                            orange: 'bg-orange-500',
                            gray: 'bg-gray-500',
                        };

                        return (
                            <div key={type} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg">{config.icon}</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {config.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {data.items} items
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {data.count}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                    <div
                                        className={`${colorClasses[config.color] || colorClasses.gray} h-2.5 rounded-full transition-all duration-500`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Status & Activity Overview */}
            <div className="space-y-6">
                {/* Status Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Trạng thái</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                    Đang hoạt động
                                </span>
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="text-2xl font-bold text-green-900 dark:text-green-200">
                                {chartData.byStatus.active || 0}
                            </div>
                            <div className="text-xs text-green-700 dark:text-green-400 mt-1">
                                {chartData.total > 0
                                    ? Math.round(((chartData.byStatus.active || 0) / chartData.total) * 100)
                                    : 0}% tổng số
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
                                    Tạm dừng
                                </span>
                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {chartData.byStatus.inactive || 0}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {chartData.total > 0
                                    ? Math.round(((chartData.byStatus.inactive || 0) / chartData.total) * 100)
                                    : 0}% tổng số
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Hoạt động gần đây</span>
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                                        {chartData.recentActivity} collections
                                    </div>
                                    <div className="text-xs text-blue-700 dark:text-blue-400">
                                        Đã sử dụng trong 7 ngày qua
                                    </div>
                                </div>
                            </div>
                        </div>
                        {statistics && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Tổng items
                                    </div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                        {(statistics.total_items || 0).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Trung bình
                                    </div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                        {chartData.total > 0
                                            ? Math.round((statistics.total_items || 0) / chartData.total)
                                            : 0} items/collection
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

