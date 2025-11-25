import QuotaProgress from './QuotaProgress';

export default function PackageCard({ package: pkg, onPurchase, isPurchasing, isPurchased = false, isFree = false }) {
    const getTypeLabel = (type) => {
        const labels = {
            messages: 'Tin nhắn',
            api_calls: 'API Calls',
            storage: 'Lưu trữ',
        };
        return labels[type] || type;
    };

    const getTypeGradient = (type) => {
        const gradients = {
            messages: 'from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600',
            api_calls: 'from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600',
            storage: 'from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600',
        };
        return gradients[type] || 'from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700';
    };

    const getTypeIcon = (type) => {
        if (type === 'messages') {
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            );
        }
        if (type === 'api_calls') {
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            );
        }
        if (type === 'storage') {
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
            );
        }
        return null;
    };

    const formatNumber = (num) => {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    return (
        <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-transparent hover:-translate-y-1">
            {/* Gradient Header */}
            <div className={`relative h-32 bg-gradient-to-br ${getTypeGradient(pkg.type)} overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-2xl"></div>

                <div className="relative h-full flex flex-col justify-between p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg`}>
                            {getTypeIcon(pkg.type)}
                        </div>
                        <span className="px-3 py-1 text-xs font-semibold bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                            {getTypeLabel(pkg.type)}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-1 drop-shadow-lg">{pkg.name}</h3>
                        {pkg.description && (
                            <p className="text-sm text-white/90 line-clamp-1">{pkg.description}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
                {/* Quota & Duration */}
                <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Quota</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {formatNumber(pkg.quota)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Thời hạn</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {pkg.duration_days ? `${pkg.duration_days} ngày` : 'Vô thời hạn'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features */}
                {pkg.features && pkg.features.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tính năng bao gồm:</h4>
                        <ul className="space-y-2">
                            {pkg.features.map((feature, index) => (
                                <li key={index} className="flex items-start gap-3 text-sm">
                                    <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Price & Purchase Button */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Giá</p>
                            {isFree ? (
                                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                                    Miễn phí
                                </p>
                            ) : (
                                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                                    {new Intl.NumberFormat('vi-VN').format(pkg.price)} <span className="text-lg text-gray-600 dark:text-gray-400">VND</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {isPurchased ? (
                        <div className="w-full py-3.5 px-6 rounded-xl font-semibold bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 border-2 border-green-300 dark:border-green-700 flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Đã mua</span>
                        </div>
                    ) : isFree ? (
                        <div className="w-full py-3.5 px-6 rounded-xl font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-700 flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Gói miễn phí</span>
                        </div>
                    ) : (
                        <button
                            onClick={onPurchase}
                            disabled={isPurchasing || !pkg.is_active}
                            className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl ${
                                pkg.type === 'messages'
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                                    : pkg.type === 'api_calls'
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                            }`}
                        >
                            {isPurchasing ? (
                                <span className="flex items-center justify-center space-x-2">
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Đang xử lý...</span>
                                </span>
                            ) : (
                                <span className="flex items-center justify-center space-x-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    <span>Mua ngay</span>
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Hover Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 dark:from-gray-800/0 dark:to-gray-800/0 group-hover:from-white/5 group-hover:to-transparent dark:group-hover:from-gray-700/5 pointer-events-none transition-all duration-300 rounded-2xl"></div>
        </div>
    );
}
