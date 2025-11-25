import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import useConfirmDialog from '../../../Hooks/useConfirmDialog';
import { toast } from '../../../Utils/toast';
import AdminLayout from '../../../Layouts/AdminLayout';

export default function AccountShow({ user }) {
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

    return (
        <AdminLayout title={`Tài khoản: ${user.name}`}>
            <Head title={`Tài khoản: ${user.name}`} />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href="/admin/accounts"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Quay lại
                        </Link>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                            Chi tiết tài khoản
                        </h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Thông tin cơ bản</h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tên</dt>
                                    <dd className="mt-1 text-lg text-gray-900 dark:text-white">{user.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                                    <dd className="mt-1 text-lg text-gray-900 dark:text-white">{user.email}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Trạng thái xác thực</dt>
                                    <dd className="mt-1">
                                        {user.email_verified_at ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                Đã xác thực
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                                Chưa xác thực
                                            </span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Ngày tạo</dt>
                                    <dd className="mt-1 text-lg text-gray-900 dark:text-white">
                                        {new Date(user.created_at).toLocaleString('vi-VN')}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Cập nhật lần cuối</dt>
                                    <dd className="mt-1 text-lg text-gray-900 dark:text-white">
                                        {new Date(user.updated_at).toLocaleString('vi-VN')}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {user.wallet && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Ví</h3>
                                <dl className="space-y-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Số dư</dt>
                                        <dd className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.wallet.balance || 0)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        )}

                        {user.transactions && user.transactions.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Giao dịch gần đây</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                            <tr>
                                                <th className="px-6 py-3">Loại</th>
                                                <th className="px-6 py-3">Số tiền</th>
                                                <th className="px-6 py-3">Trạng thái</th>
                                                <th className="px-6 py-3">Ngày</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {user.transactions.map((transaction) => (
                                                <tr key={transaction.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                                    <td className="px-6 py-4">{transaction.type}</td>
                                                    <td className="px-6 py-4">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transaction.amount || 0)}
                                                    </td>
                                                    <td className="px-6 py-4">{transaction.status}</td>
                                                    <td className="px-6 py-4">
                                                        {new Date(transaction.created_at).toLocaleDateString('vi-VN')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Vai trò</h3>
                            {user.roles && user.roles.length > 0 ? (
                                <div className="space-y-2">
                                    {user.roles.map((role) => (
                                        <span
                                            key={role.id}
                                            className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                        >
                                            {role.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400">Không có vai trò</p>
                            )}
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Thao tác</h3>
                            <div className="space-y-2">
                                <Link
                                    href={`/admin/accounts/${user.id}/edit`}
                                    className="block w-full px-4 py-2 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    Chỉnh sửa
                                </Link>
                                {user.email_verified_at ? (
                                    <button
                                        onClick={() => router.post(`/admin/accounts/${user.id}/unverify-email`, {}, { preserveScroll: true })}
                                        className="block w-full px-4 py-2 text-center bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium"
                                    >
                                        Bỏ xác thực email
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => router.post(`/admin/accounts/${user.id}/verify-email`, {}, { preserveScroll: true })}
                                        className="block w-full px-4 py-2 text-center bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                                    >
                                        Xác thực email
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        confirmDialog({
                                            title: 'Xóa tài khoản',
                                            message: `Bạn có chắc chắn muốn xóa tài khoản "${user.name}"?`,
                                            description: 'Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa.',
                                            variant: 'danger',
                                            confirmLabel: 'Xóa',
                                            cancelLabel: 'Hủy',
                                            onConfirm: () => {
                                                router.delete(`/admin/accounts/${user.id}`, {
                                                    onSuccess: () => {
                                                        toast.success('Đã xóa tài khoản thành công');
                                                    },
                                                    onError: () => {
                                                        toast.error('Lỗi khi xóa tài khoản');
                                                    },
                                                });
                                            },
                                        });
                                    }}
                                    className="block w-full px-4 py-2 text-center bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    Xóa tài khoản
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogProps} />
        </AdminLayout>
    );
}

