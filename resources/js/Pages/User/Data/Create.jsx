import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import UserLayout from '../../../Layouts/UserLayout';
import DataSidebar from '../../../Components/Data/DataSidebar';
import MobileDrawer from '../../../Components/Data/MobileDrawer';
import Breadcrumbs from '../../../Components/Data/Breadcrumbs';
import IconPicker from '../../../Components/Data/IconPicker';
import BulkItemCreator from '../../../Components/Data/BulkItemCreator';
import route from '../../../Utils/route';
import { toast } from '../../../Utils/toast';

export default function DataCreate({ sidebarCollections = [], statistics = null }) {
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [showBulkCreator, setShowBulkCreator] = useState(false);
    const [createdCollectionId, setCreatedCollectionId] = useState(null);
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        type: 'custom',
        description: '',
        icon: '',
        color: '#3B82F6',
        is_active: true,
        is_public: false,
        metadata: null,
        items: [],
    });

    const [newItem, setNewItem] = useState({
        key: '',
        value: '',
        label: '',
        description: '',
        data_type: 'string',
        order: 0,
        tags: [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('user.data.store'), {
            onSuccess: () => {
                toast.success('Đã tạo collection thành công');
            },
            onError: () => {
                toast.error('Lỗi khi tạo collection');
            },
        });
    };

    const addItem = () => {
        if (!newItem.key && !newItem.value) {
            toast.warning('Vui lòng nhập key hoặc value');
            return;
        }

        setData('items', [...data.items, { ...newItem, order: data.items.length }]);
        setNewItem({
            key: '',
            value: '',
            label: '',
            description: '',
            data_type: 'string',
            order: 0,
            tags: [],
        });
    };

    const removeItem = (index) => {
        setData('items', data.items.filter((_, i) => i !== index));
    };

    // Initialize Flowbite
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Flowbite) {
            window.Flowbite.init();
        }
    }, []);

    const typeOptions = [
        { value: 'accounts', label: 'Tài khoản', icon: '👤' },
        { value: 'comments', label: 'Bình luận', icon: '💬' },
        { value: 'posts', label: 'Bài viết', icon: '📝' },
        { value: 'products', label: 'Sản phẩm', icon: '🛍️' },
        { value: 'custom', label: 'Tùy chỉnh', icon: '📦' },
    ];

    const breadcrumbItems = [
        { label: 'Trang chủ', href: '/dashboard' },
        { label: 'Dữ liệu', href: route('user.data.index') },
        { label: 'Tạo mới', href: route('user.data.create') },
    ];

    return (
        <UserLayout title="Tạo collection mới">
            <Head title="Tạo collection mới" />
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
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto">
                        {/* Breadcrumbs */}
                        <Breadcrumbs items={breadcrumbItems} />

                        <div className="mb-6 flex items-center space-x-3">
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
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Tạo collection mới</h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">
                                    Tạo một collection mới để quản lý dữ liệu của bạn
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Info - Flowbite Card */}
                            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Thông tin cơ bản</span>
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            Tên collection <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            placeholder="Nhập tên collection"
                                            required
                                        />
                                        {errors.name && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="type" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            Loại <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="type"
                                            value={data.type}
                                            onChange={(e) => setData('type', e.target.value)}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            required
                                        >
                                            {typeOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.icon} {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.type && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.type}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            Mô tả
                                        </label>
                                        <textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            rows={3}
                                            className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            placeholder="Nhập mô tả cho collection..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <IconPicker
                                                value={data.icon}
                                                onChange={(icon) => setData('icon', icon)}
                                                label="Icon"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="color" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                Màu sắc
                                            </label>
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="color"
                                                    id="color"
                                                    value={data.color}
                                                    onChange={(e) => setData('color', e.target.value)}
                                                    className="w-16 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={data.color}
                                                    onChange={(e) => setData('color', e.target.value)}
                                                    className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                    placeholder="#3B82F6"
                                                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-6">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Đang hoạt động</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.is_public}
                                                onChange={(e) => setData('is_public', e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Công khai</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Items Section - Flowbite Card */}
                            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        <span>Items (tùy chọn)</span>
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkCreator(true)}
                                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center space-x-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        <span>Tạo hàng loạt</span>
                                    </button>
                                </div>

                                {/* Add Item Form */}
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Key"
                                            value={newItem.key}
                                            onChange={(e) => setNewItem({ ...newItem, key: e.target.value })}
                                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Value"
                                            value={newItem.value}
                                            onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Label"
                                            value={newItem.label}
                                            onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                        />
                                        <select
                                            value={newItem.data_type}
                                            onChange={(e) => setNewItem({ ...newItem, data_type: e.target.value })}
                                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                        >
                                            <option value="string">String</option>
                                            <option value="number">Number</option>
                                            <option value="integer">Integer</option>
                                            <option value="boolean">Boolean</option>
                                            <option value="json">JSON</option>
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Thêm item
                                    </button>
                                </div>

                                {/* Items List */}
                                {data.items.length > 0 && (
                                    <div className="space-y-2">
                                        {data.items.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                            {item.data_type}
                                                        </span>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {item.key || item.label || `Item ${index + 1}`}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {item.value || 'No value'}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="ml-4 p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Link
                                    href={route('user.data.index')}
                                    className="px-6 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                                >
                                    Hủy
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang tạo...
                                        </span>
                                    ) : (
                                        'Tạo collection'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        </UserLayout>
    );
}

