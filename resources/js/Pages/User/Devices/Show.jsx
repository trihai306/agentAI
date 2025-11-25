import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import UserLayout from '../../../Layouts/UserLayout';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import useConfirmDialog from '../../../Hooks/useConfirmDialog';
import route from '../../../Utils/route';
import { toast } from '../../../Utils/toast';
import axios from 'axios';

export default function UserDeviceShow({ device }) {
    const { flash } = usePage().props;
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

    const handleToggleActive = async () => {
        confirmDialog({
            title: device.is_active ? 'Tạm dừng thiết bị' : 'Kích hoạt thiết bị',
            message: `Bạn có chắc chắn muốn ${device.is_active ? 'tạm dừng' : 'kích hoạt'} thiết bị "${device.name}"?`,
            variant: 'warning',
            confirmLabel: device.is_active ? 'Tạm dừng' : 'Kích hoạt',
            cancelLabel: 'Hủy',
            onConfirm: async () => {
        try {
            const response = await axios.post(route('devices.toggle-active', device.id));
            if (response.data.success) {
                        toast.success(`Đã ${device.is_active ? 'tạm dừng' : 'kích hoạt'} thiết bị thành công`);
                router.reload();
                    } else {
                        toast.error('Lỗi khi thay đổi trạng thái thiết bị');
            }
        } catch (error) {
            console.error('Error toggling device:', error);
                    toast.error('Lỗi khi thay đổi trạng thái thiết bị');
        }
            },
        });
    };

    const handleDelete = async () => {
        confirmDialog({
            title: 'Xóa thiết bị',
            message: `Bạn có chắc chắn muốn xóa thiết bị "${device.name}"?`,
            description: 'Hành động này không thể hoàn tác.',
            variant: 'danger',
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            onConfirm: () => {
                router.delete(route('devices.destroy', device.id), {
                    onSuccess: () => {
                        toast.success('Đã xóa thiết bị thành công');
                    },
                    onError: () => {
                        toast.error('Lỗi khi xóa thiết bị');
                    },
                });
            },
        });
    };

    return (
        <UserLayout title="Chi tiết thiết bị">
            <Head title="Chi tiết thiết bị" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Chi tiết thiết bị
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {device.name || device.model || 'Thiết bị'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link
                            href={route('devices.edit', device.id)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            Chỉnh sửa
                        </Link>
                        <button
                            onClick={handleToggleActive}
                            className={`px-4 py-2 text-sm font-medium rounded-lg ${
                                device.is_active
                                    ? 'text-orange-700 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300'
                                    : 'text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                            }`}
                        >
                            {device.is_active ? 'Tạm dừng' : 'Kích hoạt'}
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                        >
                            Xóa
                        </button>
                        <Link
                            href={route('devices.index')}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            Quay lại
                        </Link>
                    </div>
                </div>

                {/* Device Details */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tên thiết bị</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                    {device.name || '-'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">UDID</dt>
                                <dd className="mt-1 text-sm font-mono text-gray-900 dark:text-white">
                                    {device.udid || '-'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Model</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {device.model || '-'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nền tảng</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md ${
                                        device.platform === 'android'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : device.platform === 'ios'
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                    }`}>
                                        {device.platform === 'android' ? '🤖 Android' : device.platform === 'ios' ? '🍎 iOS' : 'Unknown'}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phiên bản</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {device.version || '-'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Trạng thái</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md ${
                                        device.status === 'device'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                    }`}>
                                        {device.status === 'device' ? 'Đã kết nối' : 'Ngắt kết nối'}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Hoạt động</dt>
                                <dd className="mt-1">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        device.is_active
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                        {device.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                                    </span>
                                </dd>
                            </div>
                            {device.last_seen_at && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Lần cuối</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {new Date(device.last_seen_at).toLocaleString('vi-VN')}
                                    </dd>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogProps} />
        </UserLayout>
    );
}

