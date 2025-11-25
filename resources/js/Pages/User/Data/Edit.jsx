import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import UserLayout from '../../../Layouts/UserLayout';
import DataSidebar from '../../../Components/Data/DataSidebar';
import MobileDrawer from '../../../Components/Data/MobileDrawer';
import Breadcrumbs from '../../../Components/Data/Breadcrumbs';
import IconPicker from '../../../Components/Data/IconPicker';
import route from '../../../Utils/route';
import { toast } from '../../../Utils/toast';

export default function DataEdit({ collection, sidebarCollections = [], statistics = null }) {
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const { data, setData, put, processing, errors } = useForm({
        name: collection.name || '',
        description: collection.description || '',
        icon: collection.icon || '',
        color: collection.color || '#3B82F6',
        is_active: collection.is_active ?? true,
        is_public: collection.is_public ?? false,
        metadata: collection.metadata || null,
    });

    // Initialize Flowbite
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Flowbite) {
            window.Flowbite.init();
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('user.data.update', collection.id), {
            onSuccess: () => {
                toast.success('Đã cập nhật collection thành công');
            },
            onError: () => {
                toast.error('Lỗi khi cập nhật collection');
            },
        });
    };

    const breadcrumbItems = [
        { label: 'Trang chủ', href: '/dashboard' },
        { label: 'Dữ liệu', href: route('user.data.index') },
        { label: collection.name, href: route('user.data.show', collection.id) },
        { label: 'Chỉnh sửa', href: route('user.data.edit', collection.id) },
    ];

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

    return (
        <UserLayout title={`Chỉnh sửa ${collection.name}`}>
            <Head title={`Chỉnh sửa ${collection.name}`} />
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
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Chỉnh sửa collection</h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">
                                    Cập nhật thông tin collection của bạn
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

                            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Link
                                    href={route('user.data.show', collection.id)}
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
                                            Đang cập nhật...
                                        </span>
                                    ) : (
                                        'Cập nhật'
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

