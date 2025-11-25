import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import route from '../../../Utils/route';

export default function MessagesShow({ message }) {
    return (
        <AdminLayout title="Chi tiết tin nhắn">
            <Head title="Chi tiết tin nhắn" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Chi tiết tin nhắn
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            ID: {message.id}
                        </p>
                    </div>
                    <Link
                        href={route('admin.messages.index')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Quay lại
                    </Link>
                </div>

                {/* Message Details */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Message Info */}
                    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Thông tin tin nhắn
                        </h3>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    ID
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {message.id}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Vai trò
                                </dt>
                                <dd className="mt-1">
                                    <span
                                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            message.role === 'user'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                        }`}
                                    >
                                        {message.role === 'user' ? 'Người dùng' : 'Hệ thống'}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Ngày tạo
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {new Date(message.created_at).toLocaleString('vi-VN')}
                                </dd>
                            </div>
                            {message.updated_at && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Ngày cập nhật
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {new Date(message.updated_at).toLocaleString('vi-VN')}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* User Info */}
                    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Thông tin người dùng
                        </h3>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Tên
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {message.user?.name || '-'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Email
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {message.user?.email || '-'}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Session Info */}
                    {message.chat_session && (
                        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 lg:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Thông tin session
                            </h3>
                            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Tên session
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {message.chat_session.name || '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Session ID
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                                        {message.chat_session.session_id || '-'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Nội dung
                        </h3>
                        <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                            <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white font-sans">
                                {message.content || '-'}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

