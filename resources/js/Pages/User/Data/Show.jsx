import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import UserLayout from '../../../Layouts/UserLayout';
import DataSidebar from '../../../Components/Data/DataSidebar';
import MobileDrawer from '../../../Components/Data/MobileDrawer';
import Breadcrumbs from '../../../Components/Data/Breadcrumbs';
import QuickActions from '../../../Components/Data/QuickActions';
import BulkItemCreator from '../../../Components/Data/BulkItemCreator';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import useConfirmDialog from '../../../Hooks/useConfirmDialog';
import route from '../../../Utils/route';
import { toast } from '../../../Utils/toast';

export default function DataShow({ collection, items, filters: initialFilters, sidebarCollections = [], statistics = null }) {
    const { flash } = usePage().props;
    const [filters, setFilters] = useState(initialFilters || {});
    const [selectedItems, setSelectedItems] = useState([]);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showBulkCreator, setShowBulkCreator] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
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

    if (!collection) {
        return (
            <UserLayout title="Collection không tồn tại">
                <Head title="Collection không tồn tại" />
                <div className="p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400">Collection không tồn tại</p>
                    <Link href={route('user.data.index')} className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
                        Quay lại danh sách
                    </Link>
                </div>
            </UserLayout>
        );
    }

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        router.get(
            route('user.data.show', collection.id),
            newFilters,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleDeleteItem = (item) => {
        confirmDialog({
            title: 'Xóa item',
            message: `Bạn có chắc chắn muốn xóa item "${item.label || item.key || 'này'}"?`,
            variant: 'danger',
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            onConfirm: () => {
                router.delete(route('user.data.items.destroy', item.id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Đã xóa item thành công');
                    },
                    onError: () => {
                        toast.error('Lỗi khi xóa item');
                    },
                });
            },
        });
    };

    const handleBulkDelete = () => {
        if (selectedItems.length === 0) {
            toast.warning('Vui lòng chọn items để xóa');
            return;
        }

        confirmDialog({
            title: 'Xóa nhiều items',
            message: `Bạn có chắc chắn muốn xóa ${selectedItems.length} items?`,
            description: 'Hành động này không thể hoàn tác.',
            variant: 'danger',
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            onConfirm: () => {
                router.post(route('user.data.items.bulk-delete', collection.id), {
                    item_ids: selectedItems,
                }, {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success(`Đã xóa ${selectedItems.length} items thành công`);
                        setSelectedItems([]);
                    },
                    onError: () => {
                        toast.error('Lỗi khi xóa items');
                    },
                });
            },
        });
    };

    const formatValue = (value, dataType) => {
        if (value === null || value === undefined) return '-';

        if (dataType === 'json' || dataType === 'array' || dataType === 'object') {
            return JSON.stringify(value, null, 2);
        }

        if (dataType === 'boolean') {
            return value ? '✓' : '✗';
        }

        return String(value);
    };

    const getTypeConfig = (type) => {
        const configs = {
            accounts: { label: 'Tài khoản', icon: '👤', color: 'blue' },
            comments: { label: 'Bình luận', icon: '💬', color: 'green' },
            posts: { label: 'Bài viết', icon: '📝', color: 'purple' },
            products: { label: 'Sản phẩm', icon: '🛍️', color: 'orange' },
            custom: { label: 'Tùy chỉnh', icon: '📦', color: 'gray' },
        };
        return configs[collection.type] || configs.custom;
    };

    const typeConfig = getTypeConfig(collection.type);

    const breadcrumbItems = [
        { label: 'Trang chủ', href: '/dashboard' },
        { label: 'Dữ liệu', href: route('user.data.index') },
        { label: collection.name, href: route('user.data.show', collection.id) },
    ];

    return (
        <UserLayout title={`${collection.name} - Quản lý dữ liệu`}>
            <Head title={`${collection.name} - Quản lý dữ liệu`} />
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
                                <div className="flex items-center space-x-2 lg:space-x-4">
                                    {/* Mobile Menu Button */}
                                    <button
                                        onClick={() => setMobileDrawerOpen(true)}
                                        className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    </button>
                                    <Link
                                        href={route('user.data.index')}
                                        className="hidden lg:block p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                    </Link>
                                    <div>
                                        <div className="flex items-center space-x-2 lg:space-x-3">
                                            {collection.icon && <span className="text-xl lg:text-2xl">{collection.icon}</span>}
                                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                                                {collection.name}
                                            </h2>
                                        </div>
                                        {collection.description && (
                                            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">
                                                {collection.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 lg:space-x-3">
                                    <button
                                        id="export-dropdown-button"
                                        data-dropdown-toggle="export-dropdown"
                                        className="px-3 lg:px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-1 lg:space-x-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span className="hidden sm:inline">Export</span>
                                        <svg className="w-4 h-4 hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    <div
                                        id="export-dropdown"
                                        className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700"
                                    >
                                        <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
                                            <li>
                                                <Link
                                                    href={route('user.data.export.json', collection.id)}
                                                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                                >
                                                    Export JSON
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    href={route('user.data.export.csv', collection.id)}
                                                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                                >
                                                    Export CSV
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                    <Link
                                        href={route('user.data.edit', collection.id)}
                                        className="px-3 lg:px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                    >
                                        <span className="hidden sm:inline">Chỉnh sửa</span>
                                        <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>

                            {/* Collection Info - Flowbite Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Loại</div>
                                        <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                                            <span className="text-lg">{typeConfig.icon}</span>
                                        </div>
                                    </div>
                                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                                        {typeConfig.label}
                                    </div>
                                </div>
                                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Số items</div>
                                        <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/20">
                                            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {collection.item_count || 0}
                                    </div>
                                </div>
                                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Trạng thái</div>
                                        <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                    </div>
                                    <div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            collection.is_active
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                            {collection.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Quyền riêng tư</div>
                                        <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/20">
                                            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            collection.is_public
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                            {collection.is_public ? 'Công khai' : 'Riêng tư'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Items Section - Flowbite Card */}
                            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Items ({items?.total || 0})
                                    </h3>
                                    <div className="flex items-center space-x-2 lg:space-x-3">
                                        {selectedItems.length > 0 && (
                                            <button
                                                onClick={handleBulkDelete}
                                                className="px-3 lg:px-4 py-2 text-sm font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                            >
                                                <span className="hidden sm:inline">Xóa {selectedItems.length} items</span>
                                                <span className="sm:hidden">Xóa {selectedItems.length}</span>
                                            </button>
                                        )}
                                        <button
                                            id="add-item-dropdown-button"
                                            data-dropdown-toggle="add-item-dropdown"
                                            className="px-3 lg:px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center space-x-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            <span className="hidden sm:inline">Thêm item</span>
                                            <svg className="w-4 h-4 hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <div
                                            id="add-item-dropdown"
                                            className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-56 dark:bg-gray-700"
                                        >
                                            <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
                                                <li>
                                                    <button
                                                        onClick={() => {
                                                            setShowAddItemModal(true);
                                                            // Close dropdown
                                                            document.getElementById('add-item-dropdown')?.classList.add('hidden');
                                                        }}
                                                        className="block w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white text-left"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                            </svg>
                                                            <span>Thêm item đơn</span>
                                                        </div>
                                                    </button>
                                                </li>
                                                <li>
                                                    <button
                                                        onClick={() => {
                                                            setShowBulkCreator(true);
                                                            document.getElementById('add-item-dropdown')?.classList.add('hidden');
                                                        }}
                                                        className="block w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white text-left"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                            </svg>
                                                            <span>Tạo hàng loạt</span>
                                                        </div>
                                                    </button>
                                                </li>
                                                <li>
                                                    <button
                                                        onClick={() => {
                                                            setShowImportModal(true);
                                                            document.getElementById('add-item-dropdown')?.classList.add('hidden');
                                                        }}
                                                        className="block w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white text-left"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                            </svg>
                                                            <span>Import từ file</span>
                                                        </div>
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Filters - Flowbite Input Group */}
                                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex-1 min-w-[200px] relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Tìm kiếm items..."
                                                value={filters.search || ''}
                                                onChange={(e) => handleFilterChange({ ...filters, search: e.target.value || undefined })}
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                                            />
                                        </div>
                                        <select
                                            value={filters.data_type || ''}
                                            onChange={(e) => handleFilterChange({ ...filters, data_type: e.target.value || undefined })}
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600"
                                        >
                                            <option value="">Tất cả loại</option>
                                            <option value="string">String</option>
                                            <option value="number">Number</option>
                                            <option value="boolean">Boolean</option>
                                            <option value="json">JSON</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Flowbite Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                            <tr>
                                                <th scope="col" className="px-6 py-3">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                        checked={selectedItems.length === (items?.data?.length || 0) && selectedItems.length > 0}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedItems(items?.data?.map(item => item.id) || []);
                                                            } else {
                                                                setSelectedItems([]);
                                                            }
                                                        }}
                                                    />
                                                </th>
                                                <th scope="col" className="px-6 py-3">Key</th>
                                                <th scope="col" className="px-6 py-3">Value</th>
                                                <th scope="col" className="px-6 py-3">Label</th>
                                                <th scope="col" className="px-6 py-3">Type</th>
                                                <th scope="col" className="px-6 py-3">Tags</th>
                                                <th scope="col" className="px-6 py-3">
                                                    <span className="sr-only">Actions</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items?.data && items.data.length > 0 ? (
                                                items.data.map((item) => (
                                                    <tr
                                                        key={item.id}
                                                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                                checked={selectedItems.includes(item.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedItems([...selectedItems, item.id]);
                                                                    } else {
                                                                        setSelectedItems(selectedItems.filter(id => id !== item.id));
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                            {item.key || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 max-w-xs">
                                                            <div className="text-sm text-gray-900 dark:text-white truncate" title={formatValue(item.value, item.data_type)}>
                                                                {formatValue(item.value, item.data_type)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900 dark:text-white">
                                                                {item.label || '-'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                                {item.data_type}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-wrap gap-1">
                                                                {item.tags && item.tags.length > 0 ? (
                                                                    item.tags.map((tag, idx) => (
                                                                        <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                                            {tag}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">-</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => handleDeleteItem(item)}
                                                                className="font-medium text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                            >
                                                                Xóa
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="px-6 py-12 text-center">
                                                        <div className="text-gray-500 dark:text-gray-400">
                                                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                            </svg>
                                                            <p className="text-lg font-medium mb-2">Chưa có items nào</p>
                                                            <button
                                                                onClick={() => setShowAddItemModal(true)}
                                                                className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                                                            >
                                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                </svg>
                                                                Thêm item đầu tiên
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {items && items.last_page > 1 && (
                                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between mt-4">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            Hiển thị <span className="font-medium">{items.from}</span> - <span className="font-medium">{items.to}</span> của <span className="font-medium">{items.total}</span> items
                                        </div>
                                        <div className="flex space-x-2">
                                            {items.current_page > 1 && (
                                                <button
                                                    onClick={() => handleFilterChange({ ...filters, page: items.current_page - 1 })}
                                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                                                >
                                                    Trước
                                                </button>
                                            )}
                                            {items.current_page < items.last_page && (
                                                <button
                                                    onClick={() => handleFilterChange({ ...filters, page: items.current_page + 1 })}
                                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                                                >
                                                    Sau
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions FAB */}
            <QuickActions />

            {/* Bulk Item Creator Modal */}
            <BulkItemCreator
                collectionId={collection.id}
                collectionType={collection.type}
                isOpen={showBulkCreator}
                onClose={() => setShowBulkCreator(false)}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogProps} />
        </UserLayout>
    );
}
