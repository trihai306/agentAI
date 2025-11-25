import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import UserLayout from '../../../Layouts/UserLayout';
import DataSidebar from '../../../Components/Data/DataSidebar';
import MobileDrawer from '../../../Components/Data/MobileDrawer';
import ResourceConsumption from '../../../Components/Data/ResourceConsumption';
import AdvancedSearch from '../../../Components/Data/AdvancedSearch';
import Breadcrumbs from '../../../Components/Data/Breadcrumbs';
import QuickActions from '../../../Components/Data/QuickActions';
import DataTable from '../../../Components/Data/DataTable';
import BulkActions from '../../../Components/Data/BulkActions';
import DataVisualization from '../../../Components/Data/DataVisualization';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import useConfirmDialog from '../../../Hooks/useConfirmDialog';
import route from '../../../Utils/route';
import { toast } from '../../../Utils/toast';

export default function DataIndex({ collections, filters: initialFilters, types = [], sidebarCollections = [], statistics = null }) {
    const { flash } = usePage().props;
    const [filters, setFilters] = useState(initialFilters || {});
    const [selectedCollections, setSelectedCollections] = useState([]);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [viewMode, setViewMode] = useState('table'); // 'table', 'visualization'
    const [showVisualization, setShowVisualization] = useState(false);
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

    // Initialize Flowbite
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Flowbite) {
            window.Flowbite.init();
        }
    }, []);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        router.get(
            route('user.data.index'),
            newFilters,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSort = (sortBy, sortOrder) => {
        handleFilterChange({ ...filters, sort_by: sortBy, sort_order: sortOrder });
    };

    const handleSelect = (ids) => {
        setSelectedCollections(ids);
    };

    const handleClearSelection = () => {
        setSelectedCollections([]);
    };

    const handleActionComplete = () => {
        router.reload({ only: ['collections'] });
    };

    const handleDelete = (collection) => {
        confirmDialog({
            title: 'Xóa collection',
            message: `Bạn có chắc chắn muốn xóa collection "${collection.name}"?`,
            description: 'Tất cả items trong collection này sẽ bị xóa. Hành động này không thể hoàn tác.',
            variant: 'danger',
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            onConfirm: () => {
                router.delete(route('user.data.destroy', collection.id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Đã xóa collection thành công');
                    },
                    onError: () => {
                        toast.error('Lỗi khi xóa collection');
                    },
                });
            },
        });
    };

    const handleDuplicate = (collection) => {
        confirmDialog({
            title: 'Sao chép collection',
            message: `Bạn có chắc chắn muốn sao chép collection "${collection.name}"?`,
            variant: 'info',
            confirmLabel: 'Sao chép',
            cancelLabel: 'Hủy',
            onConfirm: () => {
                router.post(route('user.data.duplicate', collection.id), {}, {
                    onSuccess: () => {
                        toast.success('Đã sao chép collection thành công');
                    },
                    onError: () => {
                        toast.error('Lỗi khi sao chép collection');
                    },
                });
            },
        });
    };

    const handleExport = async (collection, format = 'json') => {
        try {
            const url = format === 'json'
                ? route('user.data.export.json', collection.id)
                : route('user.data.export.csv', collection.id);

            window.open(url, '_blank');
            toast.success(`Đang tải xuống ${format.toUpperCase()}...`);
        } catch (error) {
            toast.error('Lỗi khi export collection');
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

    // Calculate stats
    const stats = {
        total: collections?.total || 0,
        active: collections?.data?.filter(c => c.is_active).length || 0,
        public: collections?.data?.filter(c => c.is_public).length || 0,
        totalItems: collections?.data?.reduce((sum, c) => sum + (c.item_count || 0), 0) || 0,
    };

    const breadcrumbItems = [
        { label: 'Trang chủ', href: '/dashboard' },
        { label: 'Dữ liệu', href: route('user.data.index') },
    ];

    return (
        <UserLayout title="Quản lý dữ liệu">
            <Head title="Quản lý dữ liệu" />
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
                <div className="flex-1 flex flex-col overflow-hidden">
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
                                        Quản lý dữ liệu
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">
                                        Quản lý tất cả collections và items của bạn
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 lg:space-x-3">
                                <button
                                    onClick={() => setShowVisualization(!showVisualization)}
                                    className={`hidden sm:flex items-center space-x-2 px-3 lg:px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        showVisualization
                                            ? 'bg-blue-600 text-white dark:bg-blue-500'
                                            : 'text-gray-700 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span className="hidden lg:inline">{showVisualization ? 'Bảng dữ liệu' : 'Trực quan hóa'}</span>
                                </button>
                                <Link
                                    href={route('user.data.statistics')}
                                    className="hidden sm:flex items-center space-x-2 px-3 lg:px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span className="hidden lg:inline">Thống kê</span>
                                </Link>
                            </div>
                        </div>

                            {/* Resource Consumption */}
                            <ResourceConsumption statistics={statistics} />

                            {/* Stats Cards - Flowbite Cards */}
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
                                        {stats.total.toLocaleString('vi-VN')}
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
                                        {stats.active.toLocaleString('vi-VN')}
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
                                        {stats.totalItems.toLocaleString('vi-VN')}
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
                                        {stats.public.toLocaleString('vi-VN')}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Công khai</div>
                                </div>
                            </div>

                            {/* Advanced Search */}
                            <AdvancedSearch
                                filters={filters}
                                types={types}
                                onFilterChange={handleFilterChange}
                            />

                            {/* Data Visualization */}
                            {showVisualization && (
                                <DataVisualization
                                    collections={collections}
                                    statistics={statistics}
                                />
                            )}

                            {/* Professional Data Table */}
                            {!showVisualization && (
                                <DataTable
                                    collections={collections}
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                    onSort={handleSort}
                                    onSelect={handleSelect}
                                    selectedIds={selectedCollections}
                                />
                            )}

                            {/* Old Table - Keep for reference but hidden */}
                            {false && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                            <tr>
                                                <th scope="col" className="px-6 py-3">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                            checked={selectedCollections.length === (collections?.data?.length || 0) && selectedCollections.length > 0}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedCollections(collections?.data?.map(c => c.id) || []);
                                                                } else {
                                                                    setSelectedCollections([]);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </th>
                                                <th scope="col" className="px-6 py-3">
                                                    <button
                                                        onClick={() => handleSort('name', filters.sort_order === 'asc' ? 'desc' : 'asc')}
                                                        className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                                                    >
                                                        <span>Tên collection</span>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                                        </svg>
                                                    </button>
                                                </th>
                                                <th scope="col" className="px-6 py-3">Loại</th>
                                                <th scope="col" className="px-6 py-3">
                                                    <button
                                                        onClick={() => handleSort('item_count', filters.sort_order === 'asc' ? 'desc' : 'asc')}
                                                        className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                                                    >
                                                        <span>Số items</span>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                                        </svg>
                                                    </button>
                                                </th>
                                                <th scope="col" className="px-6 py-3">Trạng thái</th>
                                                <th scope="col" className="px-6 py-3">Công khai</th>
                                                <th scope="col" className="px-6 py-3">
                                                    <button
                                                        onClick={() => handleSort('last_used_at', filters.sort_order === 'asc' ? 'desc' : 'asc')}
                                                        className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                                                    >
                                                        <span>Lần cuối sử dụng</span>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                                        </svg>
                                                    </button>
                                                </th>
                                                <th scope="col" className="px-6 py-3">
                                                    <span className="sr-only">Actions</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {collections?.data && collections.data.length > 0 ? (
                                                collections.data.map((collection) => {
                                                    const typeConfig = getTypeConfig(collection.type);
                                                    return (
                                                        <tr
                                                            key={collection.id}
                                                            className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                        >
                                                            <td className="px-6 py-4">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                                    checked={selectedCollections.includes(collection.id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedCollections([...selectedCollections, collection.id]);
                                                                        } else {
                                                                            setSelectedCollections(selectedCollections.filter(id => id !== collection.id));
                                                                        }
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                                <Link
                                                                    href={route('user.data.show', collection.id)}
                                                                    className="flex items-center space-x-2 hover:text-blue-600 dark:hover:text-blue-400"
                                                                >
                                                                    {collection.icon && <span>{collection.icon}</span>}
                                                                    <span>{collection.name || 'Collection không tên'}</span>
                                                                </Link>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${typeConfig.color}-100 text-${typeConfig.color}-800 dark:bg-${typeConfig.color}-900 dark:text-${typeConfig.color}-200`}>
                                                                    <span className="mr-1">{typeConfig.icon}</span>
                                                                    {typeConfig.label}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {collection.item_count || 0}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                    collection.is_active
                                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                                }`}>
                                                                    {collection.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                    collection.is_public
                                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                                }`}>
                                                                    {collection.is_public ? 'Công khai' : 'Riêng tư'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                                {formatDate(collection.last_used_at)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <button
                                                                    id={`dropdown-button-${collection.id}`}
                                                                    data-dropdown-toggle={`dropdown-${collection.id}`}
                                                                    className="inline-flex items-center p-2 text-sm font-medium text-center text-gray-500 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                                                                    type="button"
                                                                >
                                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                                    </svg>
                                                                </button>
                                                                {/* Flowbite Dropdown */}
                                                                <div
                                                                    id={`dropdown-${collection.id}`}
                                                                    className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700"
                                                                >
                                                                    <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
                                                                        <li>
                                                                            <button
                                                                                onClick={() => handleDuplicate(collection)}
                                                                                className="block w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white text-left"
                                                                            >
                                                                                <div className="flex items-center space-x-2">
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                                    </svg>
                                                                                    <span>Sao chép</span>
                                                                                </div>
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <button
                                                                                onClick={() => handleExport(collection, 'json')}
                                                                                className="block w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white text-left"
                                                                            >
                                                                                <div className="flex items-center space-x-2">
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                                    </svg>
                                                                                    <span>Export JSON</span>
                                                                                </div>
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <button
                                                                                onClick={() => handleExport(collection, 'csv')}
                                                                                className="block w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white text-left"
                                                                            >
                                                                                <div className="flex items-center space-x-2">
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                                    </svg>
                                                                                    <span>Export CSV</span>
                                                                                </div>
                                                                            </button>
                                                                        </li>
                                                                    </ul>
                                                                    <div className="py-2">
                                                                        <button
                                                                            onClick={() => handleDelete(collection)}
                                                                            className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white text-left"
                                                                        >
                                                                            <div className="flex items-center space-x-2">
                                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                                                                                </svg>
                                                                                <span>Xóa</span>
                                                                            </div>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="px-6 py-12 text-center">
                                                        <div className="text-gray-500 dark:text-gray-400">
                                                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                            </svg>
                                                            <p className="text-lg font-medium mb-2">Chưa có collection nào</p>
                                                            <p className="text-sm mb-4">Tạo collection mới để bắt đầu!</p>
                                                            <Link
                                                                href={route('user.data.create')}
                                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
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
                                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            Hiển thị <span className="font-medium">{collections.from}</span> - <span className="font-medium">{collections.to}</span> của <span className="font-medium">{collections.total}</span> collections
                                        </div>
                                        <div className="flex space-x-2">
                                            {collections.current_page > 1 && (
                                                <button
                                                    onClick={() => handleFilterChange({ ...filters, page: collections.current_page - 1 })}
                                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                                                >
                                                    Trước
                                                </button>
                                            )}
                                            {collections.current_page < collections.last_page && (
                                                <button
                                                    onClick={() => handleFilterChange({ ...filters, page: collections.current_page + 1 })}
                                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                                                >
                                                    Sau
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            <BulkActions
                selectedIds={selectedCollections}
                onClearSelection={handleClearSelection}
                onActionComplete={handleActionComplete}
            />

            {/* Quick Actions FAB */}
            <QuickActions />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogProps} />
        </UserLayout>
    );
}
