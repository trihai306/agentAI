import { useState } from 'react';
import { router } from '@inertiajs/react';
import route from '../../Utils/route';

export default function AdvancedSearch({ filters = {}, types = [], onFilterChange }) {
    const [localFilters, setLocalFilters] = useState({
        search: filters.search || '',
        type: filters.type || '',
        is_active: filters.is_active ?? '',
        is_public: filters.is_public ?? '',
        sort_by: filters.sort_by || 'updated_at',
        sort_order: filters.sort_order || 'desc',
    });

    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        if (onFilterChange) {
            onFilterChange(newFilters);
        } else {
            router.get(route('user.data.index'), newFilters, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const clearFilters = () => {
        const clearedFilters = {
            search: '',
            type: '',
            is_active: '',
            is_public: '',
            sort_by: 'updated_at',
            sort_order: 'desc',
        };
        setLocalFilters(clearedFilters);
        if (onFilterChange) {
            onFilterChange(clearedFilters);
        } else {
            router.get(route('user.data.index'), clearedFilters, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const activeFiltersCount = [
        localFilters.search,
        localFilters.type,
        localFilters.is_active,
        localFilters.is_public,
    ].filter(Boolean).length;

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

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            {/* Main Search Bar - Flowbite Input Group */}
            <div className="p-4">
                <div className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            placeholder="Tìm kiếm collections..."
                            value={localFilters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                        {localFilters.search && (
                            <button
                                onClick={() => handleFilterChange('search', '')}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                            showAdvanced || activeFiltersCount > 0
                                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            <span>Bộ lọc</span>
                            {activeFiltersCount > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </div>
                    </button>
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Xóa bộ lọc
                        </button>
                    )}
                </div>
            </div>

            {/* Advanced Filters - Collapsible */}
            {showAdvanced && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Type Filter */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                Loại
                            </label>
                            <select
                                value={localFilters.type}
                                onChange={(e) => handleFilterChange('type', e.target.value)}
                                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            >
                                <option value="">Tất cả loại</option>
                                {types.map((type) => {
                                    const config = getTypeConfig(type);
                                    return (
                                        <option key={type} value={type}>
                                            {config.icon} {config.label}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                Trạng thái
                            </label>
                            <select
                                value={localFilters.is_active}
                                onChange={(e) => handleFilterChange('is_active', e.target.value)}
                                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="true">Đang hoạt động</option>
                                <option value="false">Tạm dừng</option>
                            </select>
                        </div>

                        {/* Privacy Filter */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                Quyền riêng tư
                            </label>
                            <select
                                value={localFilters.is_public}
                                onChange={(e) => handleFilterChange('is_public', e.target.value)}
                                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            >
                                <option value="">Tất cả</option>
                                <option value="true">Công khai</option>
                                <option value="false">Riêng tư</option>
                            </select>
                        </div>

                        {/* Sort Filter */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                Sắp xếp
                            </label>
                            <select
                                value={`${localFilters.sort_by}_${localFilters.sort_order}`}
                                onChange={(e) => {
                                    const [sort_by, sort_order] = e.target.value.split('_');
                                    handleFilterChange('sort_by', sort_by);
                                    handleFilterChange('sort_order', sort_order);
                                }}
                                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                            >
                                <option value="updated_at_desc">Mới nhất</option>
                                <option value="updated_at_asc">Cũ nhất</option>
                                <option value="name_asc">Tên A-Z</option>
                                <option value="name_desc">Tên Z-A</option>
                                <option value="item_count_desc">Nhiều items nhất</option>
                                <option value="item_count_asc">Ít items nhất</option>
                                <option value="created_at_desc">Tạo gần đây</option>
                                <option value="created_at_asc">Tạo lâu nhất</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Filter Chips */}
            {activeFiltersCount > 0 && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Bộ lọc đang áp dụng:</span>
                        {localFilters.search && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Tìm: "{localFilters.search}"
                                <button
                                    onClick={() => handleFilterChange('search', '')}
                                    className="ml-2 inline-flex items-center p-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}
                        {localFilters.type && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                {getTypeConfig(localFilters.type).icon} {getTypeConfig(localFilters.type).label}
                                <button
                                    onClick={() => handleFilterChange('type', '')}
                                    className="ml-2 inline-flex items-center p-0.5 rounded-full hover:bg-green-200 dark:hover:bg-green-800"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}
                        {localFilters.is_active !== '' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                {localFilters.is_active === 'true' ? 'Đang hoạt động' : 'Tạm dừng'}
                                <button
                                    onClick={() => handleFilterChange('is_active', '')}
                                    className="ml-2 inline-flex items-center p-0.5 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}
                        {localFilters.is_public !== '' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                {localFilters.is_public === 'true' ? 'Công khai' : 'Riêng tư'}
                                <button
                                    onClick={() => handleFilterChange('is_public', '')}
                                    className="ml-2 inline-flex items-center p-0.5 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

