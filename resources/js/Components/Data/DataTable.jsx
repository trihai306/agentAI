import { useState, useMemo } from 'react';
import { Link, router } from '@inertiajs/react';
import route from '../../Utils/route';

export default function DataTable({
    collections,
    filters,
    onFilterChange,
    onSort,
    onSelect,
    selectedIds = [],
    onBulkAction
}) {
    const [sortConfig, setSortConfig] = useState({
        key: filters?.sort_by || 'updated_at',
        direction: filters?.sort_order || 'desc'
    });

    const handleSort = (key) => {
        const direction =
            sortConfig.key === key && sortConfig.direction === 'asc'
                ? 'desc'
                : 'asc';

        setSortConfig({ key, direction });
        if (onSort) {
            onSort(key, direction);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = collections?.data?.map(c => c.id) || [];
            onSelect?.(allIds);
        } else {
            onSelect?.([]);
        }
    };

    const handleSelectOne = (id, checked) => {
        if (checked) {
            onSelect?.([...selectedIds, id]);
        } else {
            onSelect?.(selectedIds.filter(selectedId => selectedId !== id));
        }
    };

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

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) {
            return (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }
        return sortConfig.direction === 'asc' ? (
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    const allSelected = collections?.data?.length > 0 &&
        selectedIds.length === collections.data.length;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-6 py-4 w-12">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    checked={allSelected}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center space-x-2">
                                    <span>Tên collection</span>
                                    <SortIcon columnKey="name" />
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-4">Loại</th>
                            <th
                                scope="col"
                                className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                onClick={() => handleSort('item_count')}
                            >
                                <div className="flex items-center space-x-2">
                                    <span>Số items</span>
                                    <SortIcon columnKey="item_count" />
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-4">Trạng thái</th>
                            <th scope="col" className="px-6 py-4">Công khai</th>
                            <th
                                scope="col"
                                className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                onClick={() => handleSort('last_used_at')}
                            >
                                <div className="flex items-center space-x-2">
                                    <span>Lần cuối sử dụng</span>
                                    <SortIcon columnKey="last_used_at" />
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {collections?.data && collections.data.length > 0 ? (
                            collections.data.map((collection) => {
                                const typeConfig = getTypeConfig(collection.type);
                                const isSelected = selectedIds.includes(collection.id);

                                return (
                                    <tr
                                        key={collection.id}
                                        className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        }`}
                                    >
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                checked={isSelected}
                                                onChange={(e) => handleSelectOne(collection.id, e.target.checked)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <Link
                                                href={route('user.data.show', collection.id)}
                                                className="flex items-center space-x-3 hover:text-blue-600 dark:hover:text-blue-400 group"
                                            >
                                                {collection.icon && (
                                                    <span className="text-xl">{collection.icon}</span>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="truncate font-semibold group-hover:underline">
                                                        {collection.name || 'Collection không tên'}
                                                    </div>
                                                    {collection.description && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                            {collection.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${typeConfig.color}-100 text-${typeConfig.color}-800 dark:bg-${typeConfig.color}-900/30 dark:text-${typeConfig.color}-300`}>
                                                <span className="mr-1.5">{typeConfig.icon}</span>
                                                {typeConfig.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {collection.item_count || 0}
                                                </span>
                                                {collection.item_count > 0 && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        items
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                collection.is_active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                    collection.is_active ? 'bg-green-500' : 'bg-gray-400'
                                                }`}></span>
                                                {collection.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                collection.is_public
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                                {collection.is_public ? (
                                                    <>
                                                        <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 2.5 10 2.5c4.478 0 8.268 3.443 9.542 7.5-1.274 4.057-5.064 7.5-9.542 7.5-4.478 0-8.268-3.443-9.542-7.5zM10 4a6 6 0 100 12 6 6 0 000-12zm-4 6a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd" />
                                                        </svg>
                                                        Công khai
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 2.5 10 2.5a9.77 9.77 0 00-5.39 1.58L3.707 2.293zM5 10a5 5 0 007.546 2.916L4.62 8.62A5 5 0 005 10z" clipRule="evenodd" />
                                                            <path d="M2.953 7.678l1.414 1.414C3.136 9.398 2.334 9.735 1.542 10c1.274 4.057 5.064 7.5 9.542 7.5 2.347 0 4.542-.684 6.378-1.864l1.423 1.423A9.96 9.96 0 0110 20C5.522 20 1.732 16.557.458 12.5a9.97 9.97 0 012.495-4.822z" />
                                                        </svg>
                                                        Riêng tư
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(collection.last_used_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Link
                                                    href={route('user.data.show', collection.id)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Xem chi tiết"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 4.5 12 4.5c4.478 0 8.268 3.443 9.542 7.5-1.274 4.057-5.064 7.5-9.542 7.5-4.478 0-8.268-3.443-9.542-7.5z" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    id={`dropdown-button-${collection.id}`}
                                                    data-dropdown-toggle={`dropdown-${collection.id}`}
                                                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    type="button"
                                                    title="Thêm tùy chọn"
                                                >
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                    </svg>
                                                </button>
                                                {/* Flowbite Dropdown */}
                                                <div
                                                    id={`dropdown-${collection.id}`}
                                                    className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-48 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                                >
                                                    <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
                                                        <li>
                                                            <Link
                                                                href={route('user.data.edit', collection.id)}
                                                                className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                                            >
                                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                                Chỉnh sửa
                                                            </Link>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="8" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            Chưa có collection nào
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                            Tạo collection mới để bắt đầu quản lý dữ liệu của bạn
                                        </p>
                                        <Link
                                            href={route('user.data.create')}
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Tạo collection đầu tiên
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {collections && collections.last_page > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            Hiển thị <span className="font-semibold">{collections.from}</span> - <span className="font-semibold">{collections.to}</span> của <span className="font-semibold">{collections.total}</span> collections
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => onFilterChange?.({ ...filters, page: collections.current_page - 1 })}
                                disabled={collections.current_page === 1}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            {/* Page Numbers */}
                            <div className="flex items-center space-x-1">
                                {Array.from({ length: Math.min(5, collections.last_page) }, (_, i) => {
                                    let pageNum;
                                    if (collections.last_page <= 5) {
                                        pageNum = i + 1;
                                    } else if (collections.current_page <= 3) {
                                        pageNum = i + 1;
                                    } else if (collections.current_page >= collections.last_page - 2) {
                                        pageNum = collections.last_page - 4 + i;
                                    } else {
                                        pageNum = collections.current_page - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => onFilterChange?.({ ...filters, page: pageNum })}
                                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                collections.current_page === pageNum
                                                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                                                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => onFilterChange?.({ ...filters, page: collections.current_page + 1 })}
                                disabled={collections.current_page === collections.last_page}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

