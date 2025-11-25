import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function BaseTable({
    columns = [],
    data = [],
    pagination = null,
    filters = {},
    onFilterChange,
    onSort,
    searchable = true,
    searchPlaceholder = 'Tìm kiếm...',
    actions = [],
    emptyMessage = 'Không có dữ liệu',
    loading = false,
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || '');
    const [sortOrder, setSortOrder] = useState(filters.sort_order || 'desc');

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        if (onFilterChange) {
            onFilterChange({ ...filters, search: value });
        }
    };

    const handleSort = (columnKey) => {
        const newSortOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(columnKey);
        setSortOrder(newSortOrder);
        if (onSort) {
            onSort(columnKey, newSortOrder);
        }
    };

    const handlePageChange = (url) => {
        if (url) {
            router.visit(url, { preserveState: true });
        }
    };

    const getSortIcon = (columnKey) => {
        if (sortBy !== columnKey) {
            return (
                <svg className="w-4 h-4 ml-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }
        return sortOrder === 'asc' ? (
            <svg className="w-4 h-4 ml-1.5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-4 h-4 ml-1.5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    const renderCell = (row, column) => {
        if (column.render) {
            return column.render(row[column.key], row);
        }

        const value = row[column.key];

        switch (column.type) {
            case 'badge':
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md ${value.className || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                        {value.label || value}
                    </span>
                );
            case 'date':
                return value ? new Date(value).toLocaleDateString('vi-VN') : '-';
            case 'datetime':
                return value ? new Date(value).toLocaleString('vi-VN') : '-';
            case 'number':
                return typeof value === 'number' ? value.toLocaleString('vi-VN') : value;
            case 'currency':
                return typeof value === 'number' ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value) : value;
            default:
                return value || '-';
        }
    };

    if (loading) {
        return (
            <div className="overflow-x-auto">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
                    <div className="animate-pulse">
                        <div className="h-12 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800"></div>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 last:border-0">
                                <div className="px-6 py-4 flex items-center space-x-4">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search bar */}
            {searchable && (
                <div className="flex justify-between items-center">
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearch}
                            className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-gray-600"
                            placeholder={searchPlaceholder}
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    scope="col"
                                    className={`px-6 py-3.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider ${
                                        column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' : ''
                                    }`}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className="flex items-center">
                                        {column.label}
                                        {column.sortable && getSortIcon(column.key)}
                                    </div>
                                </th>
                            ))}
                            {actions && (
                                <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-right">
                                    Thao tác
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <tr
                                    key={row.id || rowIndex}
                                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {renderCell(row, column)}
                                        </td>
                                    ))}
                                    {(() => {
                                        const rowActions = typeof actions === 'function' ? actions(row) : actions;
                                        return rowActions && rowActions.length > 0 ? (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex items-center justify-end space-x-3">
                                                    {rowActions.map((action, actionIndex) => {
                                                        if (action.render) {
                                                            return <div key={actionIndex}>{action.render(row)}</div>;
                                                        }
                                                        return (
                                                            <button
                                                                key={actionIndex}
                                                                onClick={() => action.onClick(row)}
                                                                className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                                                    action.variant === 'danger'
                                                                        ? 'text-red-700 hover:text-red-900 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20'
                                                                        : action.variant === 'success'
                                                                        ? 'text-green-700 hover:text-green-900 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20'
                                                                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800'
                                                                }`}
                                                                title={action.label}
                                                            >
                                                                {action.icon || action.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        ) : null;
                                    })()}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <nav className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-800" aria-label="Table navigation">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Hiển thị{' '}
                        <span className="font-medium text-gray-900 dark:text-white">
                            {pagination.from || 0}
                        </span>{' '}
                        -{' '}
                        <span className="font-medium text-gray-900 dark:text-white">
                            {pagination.to || 0}
                        </span>{' '}
                        của{' '}
                        <span className="font-medium text-gray-900 dark:text-white">
                            {pagination.total || 0}
                        </span>{' '}
                        kết quả
                    </div>
                    <div className="flex items-center space-x-1">
                        {/* First Page */}
                        <button
                            onClick={() => handlePageChange(pagination.first_page_url)}
                            disabled={!pagination.prev_page_url}
                            className="inline-flex items-center justify-center w-9 h-9 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 dark:disabled:hover:bg-gray-900 dark:disabled:hover:text-gray-400 transition-all duration-200"
                            title="Trang đầu"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>

                        {/* Previous Page */}
                        <button
                            onClick={() => handlePageChange(pagination.prev_page_url)}
                            disabled={!pagination.prev_page_url}
                            className="inline-flex items-center justify-center w-9 h-9 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 dark:disabled:hover:bg-gray-900 dark:disabled:hover:text-gray-400 transition-all duration-200"
                            title="Trang trước"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {/* Page Numbers */}
                        {[...Array(pagination.last_page)].map((_, index) => {
                            const page = index + 1;
                            if (
                                page === 1 ||
                                page === pagination.last_page ||
                                (page >= pagination.current_page - 1 && page <= pagination.current_page + 1)
                            ) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(pagination.path + '?page=' + page)}
                                        className={`inline-flex items-center justify-center min-w-[2.25rem] h-9 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
                                            page === pagination.current_page
                                                ? 'text-white bg-gray-900 border border-gray-900 shadow-sm dark:bg-gray-800 dark:border-gray-800'
                                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            } else if (page === pagination.current_page - 2 || page === pagination.current_page + 2) {
                                return (
                                    <span
                                        key={page}
                                        className="inline-flex items-center justify-center w-9 h-9 text-sm font-medium text-gray-500 dark:text-gray-400"
                                    >
                                        ...
                                    </span>
                                );
                            }
                            return null;
                        })}

                        {/* Next Page */}
                        <button
                            onClick={() => handlePageChange(pagination.next_page_url)}
                            disabled={!pagination.next_page_url}
                            className="inline-flex items-center justify-center w-9 h-9 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 dark:disabled:hover:bg-gray-900 dark:disabled:hover:text-gray-400 transition-all duration-200"
                            title="Trang sau"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Last Page */}
                        <button
                            onClick={() => handlePageChange(pagination.last_page_url)}
                            disabled={!pagination.next_page_url}
                            className="inline-flex items-center justify-center w-9 h-9 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 dark:disabled:hover:bg-gray-900 dark:disabled:hover:text-gray-400 transition-all duration-200"
                            title="Trang cuối"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </nav>
            )}
        </div>
    );
}

