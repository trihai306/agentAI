import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import UserLayout from '../../Layouts/UserLayout';
import PackageCard from '../../Components/Packages/PackageCard';
import ConfirmDialog from '../../Components/Admin/ConfirmDialog';
import useConfirmDialog from '../../Hooks/useConfirmDialog';
import route from '../../Utils/route';
import { toast } from '../../Utils/toast';

export default function PackagesIndex({ packages, filters: initialFilters, purchasedPackageIds = [] }) {
    const { walletBalance, flash } = usePage().props;
    const [filters, setFilters] = useState(initialFilters || {});
    const [purchasingPackageId, setPurchasingPackageId] = useState(null);
    const { confirmDialog, hideDialog, dialogProps } = useConfirmDialog();

    // Show toast notifications from flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        router.get(
            route('packages.index'),
            newFilters,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handlePurchase = (packageId, packageName, isPurchased, isFree) => {
        if (isPurchased) {
            toast.warning('Bạn đã mua gói dịch vụ này rồi!');
            return;
        }

        if (isFree) {
            toast.info('Gói miễn phí này đã được kích hoạt tự động cho bạn.');
            return;
        }

        confirmDialog({
            title: 'Xác nhận mua gói dịch vụ',
            message: `Bạn có chắc chắn muốn mua gói "${packageName}"?`,
            variant: 'info',
            confirmLabel: 'Mua ngay',
            cancelLabel: 'Hủy',
            onConfirm: () => {
                setPurchasingPackageId(packageId);
                router.post(
                    route('packages.purchase', packageId),
                    {},
                    {
                        onSuccess: (page) => {
                            setPurchasingPackageId(null);
                            toast.success('Mua gói dịch vụ thành công!');
                        },
                        onError: (errors) => {
                            setPurchasingPackageId(null);
                            const errorMessage = errors?.message || errors?.error || 'Có lỗi xảy ra khi mua gói dịch vụ';
                            toast.error(errorMessage);
                        },
                    }
                );
            },
        });
    };

    const getTypeLabel = (type) => {
        const labels = {
            messages: 'Tin nhắn',
            api_calls: 'API Calls',
            storage: 'Lưu trữ',
        };
        return labels[type] || type;
    };

    const getTypeIcon = (type) => {
        if (type === 'messages') {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            );
        }
        if (type === 'api_calls') {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            );
        }
        if (type === 'storage') {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
            );
        }
        return null;
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(value || 0);
    };

    // Chuyển đổi packages từ object groupBy sang array
    let packagesArray = [];
    if (packages) {
        if (Array.isArray(packages)) {
            packagesArray = packages;
        } else if (typeof packages === 'object') {
            packagesArray = Object.values(packages).flat();
        }
    }

    return (
        <UserLayout title="Gói dịch vụ">
            <Head title="Gói dịch vụ" />
            <div className="space-y-8">
                {/* Hero Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-8 md:p-12 text-white">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full -ml-40 -mb-40 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div className="flex-1">
                                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <span className="text-sm font-semibold">Gói dịch vụ</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                                    Chọn gói dịch vụ phù hợp
                                </h1>
                                <p className="text-lg text-white/90 max-w-2xl">
                                    Nâng cấp trải nghiệm của bạn với các gói dịch vụ được tối ưu hóa cho mọi nhu cầu
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <div className="px-6 py-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
                                    <p className="text-xs text-white/80 mb-1">Số dư ví</p>
                                    <p className="text-2xl font-bold">{formatCurrency(walletBalance || 0)}</p>
                                </div>
                                <a
                                    href={route('packages.my-packages')}
                                    className="px-6 py-4 bg-white text-blue-600 hover:bg-white/90 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>Gói của tôi</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                {packages && Object.keys(packages).length > 0 && (
                    <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                            onClick={() => handleFilterChange({ ...filters, type: null })}
                            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                                !filters.type
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            <span>Tất cả</span>
                        </button>
                        {Object.keys(packages).map((type) => (
                            <button
                                key={type}
                                onClick={() => handleFilterChange({ ...filters, type })}
                                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                                    filters.type === type
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'
                                }`}
                            >
                                {getTypeIcon(type)}
                                <span>{getTypeLabel(type)}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Packages Grid */}
                {packagesArray.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 mb-6">
                            <svg
                                className="w-10 h-10 text-gray-400 dark:text-gray-500"
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
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Không có gói dịch vụ nào
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            Hiện tại không có gói dịch vụ khả dụng. Vui lòng quay lại sau.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {packagesArray
                            .filter((pkg) => {
                                if (!filters.type) return true;
                                return pkg.type === filters.type;
                            })
                            .map((pkg) => {
                                if (!pkg || !pkg.id) {
                                    return null;
                                }
                                const isPurchased = purchasedPackageIds.includes(pkg.id);
                                const isFree = pkg.price === 0 || pkg.price === '0' || pkg.is_default === true;
                                return (
                                    <PackageCard
                                        key={pkg.id}
                                        package={pkg}
                                        onPurchase={() => handlePurchase(pkg.id, pkg.name, isPurchased, isFree)}
                                        isPurchasing={purchasingPackageId === pkg.id}
                                        isPurchased={isPurchased}
                                        isFree={isFree}
                                    />
                                );
                            })
                            .filter(Boolean)}
                    </div>
                )}

                {/* Info Box */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-3xl shadow-xl border border-blue-200 dark:border-gray-700 p-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/20 dark:bg-blue-900/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                                    Lưu ý khi mua gói dịch vụ
                                </h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                                        <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span>Gói dịch vụ sẽ được kích hoạt ngay sau khi thanh toán thành công</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                                        <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span>Quota sẽ được cộng dồn nếu bạn mua nhiều gói cùng loại</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                                        <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span>Gói có thời hạn sẽ tự động hết hạn sau khi hết thời gian quy định</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                                        <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span>Bạn có thể xem chi tiết gói đã mua tại trang "Gói của tôi"</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
