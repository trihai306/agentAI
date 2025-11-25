import { useEffect, useState } from 'react';
import route from '../../Utils/route';

export default function ResourceConsumption({ statistics = null }) {
    const stats = statistics;
    const loading = !statistics;
    const [animatedValues, setAnimatedValues] = useState({
        total: 0,
        active: 0,
        total_items: 0,
        public: 0,
    });

    // Animate counters
    useEffect(() => {
        if (stats) {
            const duration = 1000;
            const steps = 60;
            const stepDuration = duration / steps;

            const animateValue = (start, end, callback) => {
                let current = start;
                const increment = (end - start) / steps;
                const timer = setInterval(() => {
                    current += increment;
                    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                        current = end;
                        clearInterval(timer);
                    }
                    callback(Math.floor(current));
                }, stepDuration);
            };

            animateValue(0, stats.total || 0, (val) => setAnimatedValues(prev => ({ ...prev, total: val })));
            animateValue(0, stats.active || 0, (val) => setAnimatedValues(prev => ({ ...prev, active: val })));
            animateValue(0, stats.total_items || 0, (val) => setAnimatedValues(prev => ({ ...prev, total_items: val })));
            animateValue(0, stats.public || 0, (val) => setAnimatedValues(prev => ({ ...prev, public: val })));
        }
    }, [stats]);

    if (loading) {
        return (
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    const maxTotal = Math.max(stats.total || 1, 1);
    const maxItems = Math.max(stats.total_items || 1, 1);

    const statsItems = [
        {
            label: 'Tổng Collections',
            value: stats.total || 0,
            animatedValue: animatedValues.total,
            icon: '📊',
            color: 'blue',
            progress: ((stats.total || 0) / maxTotal) * 100,
            description: 'Tổng số collections bạn đã tạo',
        },
        {
            label: 'Đang hoạt động',
            value: stats.active || 0,
            animatedValue: animatedValues.active,
            icon: '✅',
            color: 'green',
            progress: stats.total > 0 ? ((stats.active || 0) / stats.total) * 100 : 0,
            description: 'Collections đang được sử dụng',
        },
        {
            label: 'Tổng Items',
            value: stats.total_items || 0,
            animatedValue: animatedValues.total_items,
            icon: '📦',
            color: 'purple',
            progress: Math.min(((stats.total_items || 0) / maxItems) * 100, 100),
            description: 'Tổng số items trong tất cả collections',
        },
        {
            label: 'Công khai',
            value: stats.public || 0,
            animatedValue: animatedValues.public,
            icon: '🌐',
            color: 'orange',
            progress: stats.total > 0 ? ((stats.public || 0) / stats.total) * 100 : 0,
            description: 'Collections được chia sẻ công khai',
        },
    ];

    const getColorClasses = (color) => {
        const colors = {
            blue: {
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                text: 'text-blue-600 dark:text-blue-400',
                progress: 'bg-blue-600 dark:bg-blue-500',
                border: 'border-blue-200 dark:border-blue-800',
                badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            },
            green: {
                bg: 'bg-green-50 dark:bg-green-900/20',
                text: 'text-green-600 dark:text-green-400',
                progress: 'bg-green-600 dark:bg-green-500',
                border: 'border-green-200 dark:border-green-800',
                badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            },
            purple: {
                bg: 'bg-purple-50 dark:bg-purple-900/20',
                text: 'text-purple-600 dark:text-purple-400',
                progress: 'bg-purple-600 dark:bg-purple-500',
                border: 'border-purple-200 dark:border-purple-800',
                badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            },
            orange: {
                bg: 'bg-orange-50 dark:bg-orange-900/20',
                text: 'text-orange-600 dark:text-orange-400',
                progress: 'bg-orange-600 dark:bg-orange-500',
                border: 'border-orange-200 dark:border-orange-800',
                badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            },
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                    <span className="text-2xl">📈</span>
                    <span>Tài nguyên tiêu tốn</span>
                </h3>
                <span
                    className="text-sm text-gray-500 dark:text-gray-400 cursor-help"
                    data-tooltip-target="resource-tooltip"
                    data-tooltip-placement="left"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statsItems.map((item, index) => {
                    const colors = getColorClasses(item.color);
                    return (
                        <div
                            key={index}
                            className={`${colors.bg} ${colors.border} border-2 rounded-lg p-4 hover:shadow-md transition-all duration-200`}
                            data-tooltip-target={`stat-${index}-tooltip`}
                            data-tooltip-placement="top"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-2xl">{item.icon}</span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${colors.badge}`}>
                                    {item.progress.toFixed(0)}%
                                </span>
                            </div>
                            <div className={`text-3xl font-bold ${colors.text} mb-2`}>
                                {item.animatedValue.toLocaleString('vi-VN')}
                            </div>
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">
                                {item.label}
                            </div>
                            {/* Flowbite Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                <div
                                    className={`${colors.progress} h-2 rounded-full transition-all duration-1000 ease-out`}
                                    style={{ width: `${item.progress}%` }}
                                ></div>
                            </div>
                            {/* Tooltip */}
                            <div
                                id={`stat-${index}-tooltip`}
                                role="tooltip"
                                className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
                            >
                                {item.description}
                                <div className="tooltip-arrow" data-popper-arrow></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Type Breakdown - Flowbite Card */}
            {stats.by_type && Object.keys(stats.by_type).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center space-x-2">
                        <span>Phân loại theo type</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            {Object.keys(stats.by_type).length} types
                        </span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(stats.by_type).map(([type, data]) => {
                            const typeProgress = data.count > 0 ? ((data.count / maxTotal) * 100) : 0;
                            return (
                                <div
                                    key={type}
                                    className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                {type.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                                                    {type}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {data.count} collections
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                {data.total_items || 0}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">items</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600 dark:text-gray-400">Collections</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {data.count} / {stats.total}
                                            </span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                            <div
                                                className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                                                style={{ width: `${typeProgress}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600 dark:text-gray-400">Trung bình</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {data.avg_items?.toFixed(1) || 0} items/collection
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tooltip for main info */}
            <div
                id="resource-tooltip"
                role="tooltip"
                className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
            >
                Thống kê về việc sử dụng tài nguyên dữ liệu của bạn
                <div className="tooltip-arrow" data-popper-arrow></div>
            </div>
        </div>
    );
}
