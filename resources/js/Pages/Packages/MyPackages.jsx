import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import UserLayout from '../../Layouts/UserLayout';
import QuotaProgress from '../../Components/Packages/QuotaProgress';
import route from '../../Utils/route';

export default function MyPackages({ userPackages, filters: initialFilters }) {
    const [filters, setFilters] = useState(initialFilters || {});

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        router.get(
            route('packages.my-packages'),
            newFilters,
            { preserveState: true, preserveScroll: true }
        );
    };

    const getStatusBadge = (userPackage) => {
        const isExpired = userPackage.expires_at && new Date(userPackage.expires_at) < new Date();
        const isActive = userPackage.status === 'active' && !isExpired;

        if (isExpired || userPackage.status === 'expired') {
            return (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                    Đã hết hạn
                </span>
            );
        }
        if (userPackage.status === 'cancelled') {
            return (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    Đã hủy
                </span>
            );
        }
        if (isActive) {
            return (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    Đang hoạt động
                </span>
            );
        }
        return (
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                Không xác định
            </span>
        );
    };

    const getTypeLabel = (type) => {
        const labels = {
            messages: 'Tin nhắn',
            api_calls: 'API Calls',
            storage: 'Lưu trữ',
        };
        return labels[type] || type;
    };

    const getTypeColor = (type) => {
        const colors = {
            messages: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            api_calls: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            storage: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        };
        return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Vô thời hạn';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(value || 0);
    };

    return (
        <UserLayout title="Gói của tôi">
            <Head title="Gói của tôi" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Gói dịch vụ của tôi
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Quản lý và theo dõi các gói dịch vụ bạn đã mua
                        </p>
                    </div>
                    <a
                        href={route('packages.index')}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Mua thêm gói</span>
                    </a>
                </div>

                {/* Filters */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                    <button
                        onClick={() => handleFilterChange({ ...filters, status: null })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                            !filters.status
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => handleFilterChange({ ...filters, status: 'active' })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                            filters.status === 'active'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        Đang hoạt động
                    </button>
                    <button
                        onClick={() => handleFilterChange({ ...filters, status: 'expired' })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                            filters.status === 'expired'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        Đã hết hạn
                    </button>
                </div>

                {/* Packages List */}
                {userPackages.data && userPackages.data.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                        <svg
                            className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                        </svg>
                        <p className="mt-4 text-lg font-medium text-gray-500 dark:text-gray-400">
                            Bạn chưa mua gói dịch vụ nào
                        </p>
                        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500 mb-6">
                            Hãy khám phá các gói dịch vụ có sẵn và chọn gói phù hợp với nhu cầu của bạn
                        </p>
                        <a
                            href={route('packages.index')}
                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Xem gói dịch vụ
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {userPackages.data?.map((userPackage) => (
                            <div
                                key={userPackage.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700"
                            >
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {userPackage.package?.name || 'Gói dịch vụ'}
                                                </h3>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(userPackage.package?.type)}`}>
                                                    {getTypeLabel(userPackage.package?.type)}
                                                </span>
                                            </div>
                                            {userPackage.package?.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                    {userPackage.package.description}
                                                </p>
                                            )}
                                        </div>
                                        {getStatusBadge(userPackage)}
                                    </div>

                                    {/* Quota Progress */}
                                    <div className="mb-4">
                                        <QuotaProgress
                                            quotaUsed={userPackage.quota_used || 0}
                                            quotaTotal={userPackage.quota_total || 0}
                                            label="Quota đã sử dụng"
                                        />
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Ngày mua:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {formatDate(userPackage.purchased_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Hết hạn:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {formatDate(userPackage.expires_at)}
                                            </span>
                                        </div>
                                        {userPackage.package?.price && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Giá mua:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(userPackage.package.price)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {userPackages.data && userPackages.data.length > 0 && userPackages.last_page > 1 && (
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Hiển thị {userPackages.from} - {userPackages.to} trong tổng số {userPackages.total} gói
                        </div>
                        <div className="flex items-center space-x-2">
                            {userPackages.current_page > 1 && (
                                <button
                                    onClick={() => handleFilterChange({ ...filters, page: userPackages.current_page - 1 })}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Trước
                                </button>
                            )}
                            {userPackages.current_page < userPackages.last_page && (
                                <button
                                    onClick={() => handleFilterChange({ ...filters, page: userPackages.current_page + 1 })}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Sau
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}

