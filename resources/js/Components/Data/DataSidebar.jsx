import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import route from '../../Utils/route';

export default function DataSidebar({ currentPath = '', collections: sidebarCollections = [], statistics = null }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Use props instead of fetching
    const collections = sidebarCollections || [];
    const stats = statistics;

    // Initialize Flowbite components
    useEffect(() => {
        // Flowbite will auto-initialize components with data attributes
        if (typeof window !== 'undefined' && window.Flowbite) {
            window.Flowbite.init();
        }
    }, []);

    const isActive = (href) => {
        return currentPath === href || currentPath.startsWith(href + '/');
    };

    // Filter collections by search query
    const filteredCollections = collections.filter(collection => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            collection.name?.toLowerCase().includes(query) ||
            collection.type?.toLowerCase().includes(query) ||
            collection.description?.toLowerCase().includes(query)
        );
    });

    // Group collections by type
    const groupedCollections = filteredCollections.reduce((acc, collection) => {
        const type = collection.type || 'other';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(collection);
        return acc;
    }, {});

    // Get type labels and icons
    const getTypeConfig = (type) => {
        const configs = {
            accounts: {
                label: 'Tài khoản',
                icon: '👤',
                color: 'blue',
                href: '/data?type=accounts',
                bgClass: 'bg-blue-50 dark:bg-blue-900/20',
                textClass: 'text-blue-700 dark:text-blue-300',
                activeBgClass: 'bg-blue-600 dark:bg-blue-700',
            },
            comments: {
                label: 'Bình luận',
                icon: '💬',
                color: 'green',
                href: '/data?type=comments',
                bgClass: 'bg-green-50 dark:bg-green-900/20',
                textClass: 'text-green-700 dark:text-green-300',
                activeBgClass: 'bg-green-600 dark:bg-green-700',
            },
            posts: {
                label: 'Bài viết',
                icon: '📝',
                color: 'purple',
                href: '/data?type=posts',
                bgClass: 'bg-purple-50 dark:bg-purple-900/20',
                textClass: 'text-purple-700 dark:text-purple-300',
                activeBgClass: 'bg-purple-600 dark:bg-purple-700',
            },
            products: {
                label: 'Sản phẩm',
                icon: '🛍️',
                color: 'orange',
                href: '/data?type=products',
                bgClass: 'bg-orange-50 dark:bg-orange-900/20',
                textClass: 'text-orange-700 dark:text-orange-300',
                activeBgClass: 'bg-orange-600 dark:bg-orange-700',
            },
            custom: {
                label: 'Tùy chỉnh',
                icon: '📦',
                color: 'gray',
                href: '/data?type=custom',
                bgClass: 'bg-gray-50 dark:bg-gray-900/20',
                textClass: 'text-gray-700 dark:text-gray-300',
                activeBgClass: 'bg-gray-600 dark:bg-gray-700',
            },
        };
        return configs[type] || configs.custom;
    };

    const sidebarWidth = isCollapsed ? 'w-16' : 'w-72';

    return (
        <div className={`${sidebarWidth} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full flex flex-col transition-all duration-300`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                {!isCollapsed && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                <span className="text-2xl" data-tooltip-target="data-tooltip" data-tooltip-placement="right">📊</span>
                                <span>Dữ liệu của tôi</span>
                            </h2>
                            <button
                                onClick={() => setIsCollapsed(true)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                                data-tooltip-target="collapse-tooltip"
                                data-tooltip-placement="left"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                </svg>
                            </button>
                        </div>

                        {/* Search Box - Flowbite Input Group */}
                        <div className="mb-4">
                            <label htmlFor="sidebar-search" className="sr-only">Tìm kiếm collections</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    id="sidebar-search"
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                                    placeholder="Tìm kiếm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats - Flowbite Cards */}
                        {stats && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm">📊</span>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Collections</span>
                                    </div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {stats.total || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm">📦</span>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Items</span>
                                    </div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                        {stats.total_items || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm">✅</span>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Active</span>
                                    </div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        {stats.active || 0}
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                )}
                {isCollapsed && (
                    <div className="flex flex-col items-center space-y-4">
                        <button
                            onClick={() => setIsCollapsed(false)}
                            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                            data-tooltip-target="expand-tooltip"
                            data-tooltip-placement="right"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                        <span className="text-2xl" data-tooltip-target="data-tooltip-collapsed" data-tooltip-placement="right">📊</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                {!isCollapsed ? (
                    <>
                        {/* All Collections */}
                        <Link
                            href="/data"
                            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isActive('/data') && !currentPath.includes('/data/statistics') && !currentPath.includes('/data/create') && !currentPath.match(/\/data\/\d+/)
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white shadow-lg'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            <span className="mr-3 text-lg">📋</span>
                            <span>Tất cả dữ liệu</span>
                        </Link>

                        {/* Statistics */}
                        <Link
                            href="/data/statistics"
                            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isActive('/data/statistics')
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 text-white shadow-lg'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            <span className="mr-3 text-lg">📈</span>
                            <span>Thống kê</span>
                        </Link>

                        {/* Divider */}
                        <div className="my-3 border-t border-gray-200 dark:border-gray-800"></div>

                        {/* Grouped Collections by Type - Flowbite Accordion */}
                        {Object.keys(groupedCollections).length > 0 ? (
                            <div id="accordion-collapse" data-accordion="collapse" className="space-y-1">
                                {Object.entries(groupedCollections).map(([type, typeCollections], index) => {
                                    const config = getTypeConfig(type);
                                    const hasActive = typeCollections.some(c => isActive(route('user.data.show', c.id)));
                                    const accordionId = `accordion-${type}`;
                                    const isFirst = index === 0;

                                    return (
                                        <div key={type} className="mb-1">
                                            <h2 id={`${accordionId}-heading`}>
                                                <button
                                                    type="button"
                                                    className={`flex items-center justify-between w-full px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                                        hasActive
                                                            ? `${config.bgClass} ${config.textClass}`
                                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                    }`}
                                                    data-accordion-target={`#${accordionId}-body`}
                                                    aria-expanded={isFirst ? 'true' : 'false'}
                                                    aria-controls={`${accordionId}-body`}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-lg">{config.icon}</span>
                                                        <span>{config.label}</span>
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                            {typeCollections.length}
                                                        </span>
                                                    </div>
                                                    <svg
                                                        data-accordion-icon
                                                        className="w-4 h-4 shrink-0 transition-transform duration-200"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            </h2>
                                            <div
                                                id={`${accordionId}-body`}
                                                className={`hidden ${isFirst ? '' : 'hidden'}`}
                                                aria-labelledby={`${accordionId}-heading`}
                                            >
                                                <div className="ml-4 mt-1 space-y-1 py-2">
                                                    {typeCollections.map((collection) => {
                                                        const collectionHref = `/data/${collection.id}`;
                                                        const collectionActive = isActive(collectionHref);
                                                        return (
                                                                <Link
                                                                    key={collection.id}
                                                                    href={collectionHref}
                                                                    className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all duration-200 ${
                                                                        collectionActive
                                                                            ? `${config.activeBgClass} text-white`
                                                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                                                    {collection.icon && (
                                                                        <span className="text-sm flex-shrink-0">{collection.icon}</span>
                                                                    )}
                                                                    <span className="truncate">{collection.name}</span>
                                                                </div>
                                                                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full flex-shrink-0 ${
                                                                    collectionActive
                                                                        ? 'bg-white/20 text-white'
                                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                                }`}>
                                                                    {collection.item_count || 0}
                                                                </span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-3 py-4 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Chưa có dữ liệu</p>
                                <Link
                                    href="/data/create"
                                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Tạo collection mới
                                </Link>
                            </div>
                        )}
                    </>
                ) : (
                    // Collapsed view - chỉ icons
                    <div className="flex flex-col items-center space-y-2">
                        <Link
                            href="/data"
                            className={`p-2 rounded-lg transition-all duration-200 ${
                                isActive('/data') && !currentPath.includes('/data/statistics') && !currentPath.includes('/data/create') && !currentPath.match(/\/data\/\d+/)
                                    ? 'bg-blue-600 dark:bg-blue-700 text-white'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                            data-tooltip-target="all-data-tooltip"
                            data-tooltip-placement="right"
                        >
                            <span className="text-lg">📋</span>
                        </Link>
                        <Link
                            href="/data/statistics"
                            className={`p-2 rounded-lg transition-all duration-200 ${
                                isActive('/data/statistics')
                                    ? 'bg-purple-600 dark:bg-purple-700 text-white'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                            data-tooltip-target="stats-tooltip"
                            data-tooltip-placement="right"
                        >
                            <span className="text-lg">📈</span>
                        </Link>
                    </div>
                )}
            </nav>

            {/* Footer - Create Button */}
            {!isCollapsed && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <Link
                        href="/data/create"
                        className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tạo mới
                    </Link>
                </div>
            )}
            {isCollapsed && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-center">
                    <Link
                        href="/data/create"
                        className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-800 transition-all duration-200"
                        data-tooltip-target="create-tooltip"
                        data-tooltip-placement="right"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </Link>
                </div>
            )}

            {/* Flowbite Tooltips */}
            <div
                id="data-tooltip"
                role="tooltip"
                className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
            >
                Dữ liệu của tôi
                <div className="tooltip-arrow" data-popper-arrow></div>
            </div>
            <div
                id="collapse-tooltip"
                role="tooltip"
                className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
            >
                Thu gọn sidebar
                <div className="tooltip-arrow" data-popper-arrow></div>
            </div>
            <div
                id="expand-tooltip"
                role="tooltip"
                className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
            >
                Mở rộng sidebar
                <div className="tooltip-arrow" data-popper-arrow></div>
            </div>
            <div
                id="all-data-tooltip"
                role="tooltip"
                className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
            >
                Tất cả dữ liệu
                <div className="tooltip-arrow" data-popper-arrow></div>
            </div>
            <div
                id="stats-tooltip"
                role="tooltip"
                className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
            >
                Thống kê
                <div className="tooltip-arrow" data-popper-arrow></div>
            </div>
            <div
                id="create-tooltip"
                role="tooltip"
                className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
            >
                Tạo mới
                <div className="tooltip-arrow" data-popper-arrow></div>
            </div>
        </div>
    );
}
