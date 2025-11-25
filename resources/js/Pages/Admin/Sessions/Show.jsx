import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import route from '../../../Utils/route';

export default function SessionsShow({ session }) {
    return (
        <AdminLayout title="Chi tiết session">
            <Head title="Chi tiết session" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Chi tiết session
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {session.name || session.session_id}
                        </p>
                    </div>
                    <Link
                        href={route('admin.sessions.index')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Quay lại
                    </Link>
                </div>

                {/* Session Details */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Basic Info */}
                    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Thông tin session
                        </h3>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Session ID
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                                    {session.session_id || '-'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Tên
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {session.name || '-'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Số tin nhắn
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {session.messages?.length || 0}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Ngày tạo
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {new Date(session.created_at).toLocaleString('vi-VN')}
                                </dd>
                            </div>
                            {session.last_message_at && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Tin nhắn cuối
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {new Date(session.last_message_at).toLocaleString('vi-VN')}
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
                                    {session.user?.name || '-'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Email
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {session.user?.email || '-'}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Messages */}
                    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Tin nhắn ({session.messages?.length || 0})
                        </h3>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {session.messages && session.messages.length > 0 ? (
                                session.messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`p-4 rounded-lg ${
                                            message.role === 'user'
                                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                                : 'bg-gray-50 dark:bg-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    message.role === 'user'
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                }`}
                                            >
                                                {message.role === 'user' ? 'Người dùng' : 'Hệ thống'}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(message.created_at).toLocaleString('vi-VN')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                            {message.content}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                                    Không có tin nhắn nào
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

