import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import route from '../../../Utils/route';

export default function RolesForm({ role, permissions }) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: role?.name || '',
        slug: role?.slug || '',
        description: role?.description || '',
        is_active: role?.is_active !== undefined ? role.is_active : true,
        permissions: role?.permissions?.map((p) => p.id) || [],
    });

    const [selectedGroups, setSelectedGroups] = useState(
        permissions ? Object.keys(permissions) : []
    );

    const handleGroupToggle = (group) => {
        setSelectedGroups((prev) =>
            prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
        );
    };

    const handlePermissionToggle = (permissionId) => {
        setData(
            'permissions',
            data.permissions.includes(permissionId)
                ? data.permissions.filter((id) => id !== permissionId)
                : [...data.permissions, permissionId]
        );
    };

    const handleSelectAllInGroup = (group) => {
        const groupPermissions = permissions[group] || [];
        const groupPermissionIds = groupPermissions.map((p) => p.id);
        const allSelected = groupPermissionIds.every((id) => data.permissions.includes(id));

        if (allSelected) {
            setData(
                'permissions',
                data.permissions.filter((id) => !groupPermissionIds.includes(id))
            );
        } else {
            setData('permissions', [...new Set([...data.permissions, ...groupPermissionIds])]);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (role) {
            put(route('admin.roles.update', role.id));
        } else {
            post(route('admin.roles.store'));
        }
    };

    return (
        <AdminLayout title={role ? 'Sửa vai trò' : 'Thêm vai trò mới'}>
            <Head title={role ? 'Sửa vai trò' : 'Thêm vai trò mới'} />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {role ? 'Sửa vai trò' : 'Thêm vai trò mới'}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {role ? 'Cập nhật thông tin vai trò' : 'Tạo vai trò mới trong hệ thống'}
                        </p>
                    </div>
                    <Link
                        href={route('admin.roles.index')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Quay lại
                    </Link>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Basic Info */}
                        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Thông tin cơ bản
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        Tên vai trò <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={`bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${
                                            errors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Nhập tên vai trò"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        Slug
                                    </label>
                                    <input
                                        type="text"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        className={`bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${
                                            errors.slug ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Tự động tạo từ tên nếu để trống"
                                    />
                                    {errors.slug && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                            {errors.slug}
                                        </p>
                                    )}
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Slug sẽ được tạo tự động từ tên nếu để trống
                                    </p>
                                </div>

                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        Mô tả
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        className={`bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${
                                            errors.description ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Nhập mô tả..."
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="is_active"
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label
                                        htmlFor="is_active"
                                        className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                                    >
                                        Kích hoạt
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Permissions */}
                        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Quyền
                            </h3>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {permissions &&
                                    Object.keys(permissions).map((group) => (
                                        <div key={group} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleGroupToggle(group)}
                                                    className="flex items-center text-sm font-medium text-gray-900 dark:text-white"
                                                >
                                                    {selectedGroups.includes(group) ? (
                                                        <svg
                                                            className="w-4 h-4 mr-2"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    ) : (
                                                        <svg
                                                            className="w-4 h-4 mr-2"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    )}
                                                    {group || 'Không nhóm'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectAllInGroup(group)}
                                                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    {permissions[group]?.every((p) =>
                                                        data.permissions.includes(p.id)
                                                    )
                                                        ? 'Bỏ chọn tất cả'
                                                        : 'Chọn tất cả'}
                                                </button>
                                            </div>
                                            {selectedGroups.includes(group) && (
                                                <div className="ml-6 space-y-2">
                                                    {permissions[group]?.map((permission) => (
                                                        <div key={permission.id} className="flex items-center">
                                                            <input
                                                                id={`permission-${permission.id}`}
                                                                type="checkbox"
                                                                checked={data.permissions.includes(permission.id)}
                                                                onChange={() =>
                                                                    handlePermissionToggle(permission.id)
                                                                }
                                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                            />
                                                            <label
                                                                htmlFor={`permission-${permission.id}`}
                                                                className="ml-2 text-sm text-gray-900 dark:text-gray-300"
                                                            >
                                                                {permission.name}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                            {errors.permissions && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    {errors.permissions}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end space-x-4">
                        <Link
                            href={route('admin.roles.index')}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            Hủy
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Đang xử lý...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

