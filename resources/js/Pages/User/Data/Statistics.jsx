import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import UserLayout from '../../../Layouts/UserLayout';
import DataSidebar from '../../../Components/Data/DataSidebar';
import MobileDrawer from '../../../Components/Data/MobileDrawer';
import ResourceConsumption from '../../../Components/Data/ResourceConsumption';
import Breadcrumbs from '../../../Components/Data/Breadcrumbs';
import route from '../../../Utils/route';
import { toast } from '../../../Utils/toast';

export default function DataStatistics({ statistics, analytics, sidebarCollections = [] }) {
    const { flash } = usePage().props;
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Initialize Flowbite
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Flowbite) {
            window.Flowbite.init();
        }
    }, []);

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

    const breadcrumbItems = [
        { label: 'Trang chủ', href: '/dashboard' },
        { label: 'Dữ liệu', href: route('user.data.index') },
        { label: 'Thống kê', href: route('user.data.statistics') },
    ];

    return (
        <UserLayout title="Thống kê dữ liệu">
            <Head title="Thống kê dữ liệu" />
            <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                {/* Mobile Drawer */}
                <MobileDrawer
                    currentPath={window.location.pathname}
                    collections={sidebarCollections}
                    statistics={statistics}
                    isOpen={mobileDrawerOpen}
                    onClose={() => setMobileDrawerOpen(false)}
                />

                {/* Desktop Sidebar */}
                <div className="hidden lg:block">
                    <DataSidebar
                        currentPath={window.location.pathname}
                        collections={sidebarCollections}
                        statistics={statistics}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Breadcrumbs */}
                        <Breadcrumbs items={breadcrumbItems} />

                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {/* Mobile Menu Button */}
                                <button
                                    onClick={() => setMobileDrawerOpen(true)}
                                    className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                                <div>
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                                        Thống kê dữ liệu
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">
                                        Xem tổng quan về dữ liệu và tài nguyên của bạn
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={route('user.data.index')}
                                className="px-3 lg:px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                            >
                                <span className="hidden sm:inline">Quay lại</span>
                                <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                        </div>

                        {/* Resource Consumption */}
                        <ResourceConsumption statistics={statistics} />

                        {/* Overview Stats - Flowbite Cards */}
                        {statistics && (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                        {(statistics.total || 0).toLocaleString('vi-VN')}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Tổng Collections</div>
                                </div>
                                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                                            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                        {(statistics.active || 0).toLocaleString('vi-VN')}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Đang hoạt động</div>
                                </div>
                                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/20">
                                            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                        {(statistics.total_items || 0).toLocaleString('vi-VN')}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Tổng Items</div>
                                </div>
                                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/20">
                                            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                        {(statistics.public || 0).toLocaleString('vi-VN')}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Công khai</div>
                                </div>
                            </div>
                        )}

                        {/* By Type Breakdown - Flowbite Cards */}
                        {analytics?.by_type && Object.keys(analytics.by_type).length > 0 && (
                            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span>Phân loại theo Type</span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                        {Object.keys(analytics.by_type).length} types
                                    </span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(analytics.by_type).map(([type, data]) => {
                                        const config = getTypeConfig(type);
                                        const maxCount = Math.max(...Object.values(analytics.by_type).map(d => d.count || 0), 1);
                                        const progress = ((data.count || 0) / maxCount) * 100;
                                        
                                        const progressColorClasses = {
                                            blue: 'bg-blue-600 dark:bg-blue-500',
                                            green: 'bg-green-600 dark:bg-green-500',
                                            purple: 'bg-purple-600 dark:bg-purple-500',
                                            orange: 'bg-orange-600 dark:bg-orange-500',
                                            gray: 'bg-gray-600 dark:bg-gray-500',
                                        };
                                        
                                        return (
                                            <div
                                                key={type}
                                                className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-all duration-200"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-2xl">{config.icon}</span>
                                                        <span className="font-semibold text-gray-900 dark:text-white capitalize">{config.label}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600 dark:text-gray-400">Collections</span>
                                                        <span className="font-bold text-gray-900 dark:text-white">{data.count || 0}</span>
                                                    </div>
                                                    {/* Progress Bar */}
                                                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                                        <div
                                                            className={`${progressColorClasses[config.color] || progressColorClasses.gray} h-2 rounded-full transition-all duration-500`}
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600 dark:text-gray-400">Items</span>
                                                        <span className="font-bold text-gray-900 dark:text-white">{data.total_items || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600 dark:text-gray-400">Trung bình</span>
                                                        <span className="font-bold text-gray-900 dark:text-white">{data.avg_items?.toFixed(1) || 0} items/collection</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Most Used & Recent - Flowbite Cards */}
                        {analytics && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Most Used */}
                                {analytics.most_used && analytics.most_used.length > 0 && (
                                    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                                            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                            <span>Sử dụng nhiều nhất</span>
                                        </h3>
                                        <div className="space-y-3">
                                            {analytics.most_used.map((collection, index) => (
                                                <Link
                                                    key={collection.id}
                                                    href={route('user.data.show', collection.id)}
                                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                                                >
                                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                                                            {index + 1}
                                                        </div>
                                                        {collection.icon && <span className="text-lg flex-shrink-0">{collection.icon}</span>}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                                {collection.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {collection.item_count || 0} items
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent */}
                                {analytics.recent && analytics.recent.length > 0 && (
                                    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Mới tạo gần đây</span>
                                        </h3>
                                        <div className="space-y-3">
                                            {analytics.recent.map((collection) => (
                                                <Link
                                                    key={collection.id}
                                                    href={route('user.data.show', collection.id)}
                                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                                                >
                                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                        {collection.icon && <span className="text-lg flex-shrink-0">{collection.icon}</span>}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                                {collection.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(collection.created_at).toLocaleDateString('vi-VN', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
