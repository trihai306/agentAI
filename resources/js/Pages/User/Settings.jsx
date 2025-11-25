import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import UserLayout from '../../Layouts/UserLayout';
import { toast } from '../../Utils/toast';

export default function Settings({ user, apiKeys }) {
    const [activeTab, setActiveTab] = useState('profile');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState({ provider: null });

    // Profile form
    const profileForm = useForm({
        name: user.name || '',
        email: user.email || '',
    });

    // Password form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // API Keys form
    const apiKeysForm = useForm({
        openai_api_key: '',
        gemini_api_key: '',
        claude_api_key: '',
    });

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        profileForm.put('/settings/profile', {
            onSuccess: () => {
                toast.success('Đã cập nhật thông tin tài khoản thành công');
                router.reload({ only: ['user'] });
            },
            onError: (errors) => {
                if (errors.name) toast.error(errors.name);
                if (errors.email) toast.error(errors.email);
            },
        });
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.put('/settings/password', {
            onSuccess: () => {
                toast.success('Đã cập nhật mật khẩu thành công');
                passwordForm.reset();
            },
            onError: (errors) => {
                if (errors.current_password) toast.error(errors.current_password);
                if (errors.password) toast.error(errors.password[0]);
            },
        });
    };

    const handleApiKeysSubmit = (e) => {
        e.preventDefault();
        apiKeysForm.put('/settings/api-keys', {
            onSuccess: () => {
                toast.success('Đã cập nhật API keys thành công');
                apiKeysForm.reset();
                router.reload({ only: ['apiKeys'] });
            },
            onError: (errors) => {
                Object.values(errors).forEach(error => {
                    if (Array.isArray(error)) {
                        error.forEach(err => toast.error(err));
                    } else {
                        toast.error(error);
                    }
                });
            },
        });
    };

    const handleDeleteApiKey = (provider) => {
        router.delete(`/settings/api-keys/${provider}`, {
            onSuccess: () => {
                toast.success('Đã xóa API key thành công');
                setShowDeleteConfirm({ provider: null });
                router.reload({ only: ['apiKeys'] });
            },
            onError: () => {
                toast.error('Lỗi khi xóa API key');
            },
        });
    };

    const tabs = [
        { id: 'profile', name: 'Thông tin tài khoản', icon: '👤' },
        { id: 'password', name: 'Mật khẩu', icon: '🔒' },
        { id: 'api-keys', name: 'API Keys', icon: '🔑' },
    ];

    return (
        <UserLayout title="Cấu hình tài khoản">
            <Head title="Cấu hình tài khoản" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Cấu hình tài khoản
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Quản lý thông tin tài khoản, mật khẩu và API keys của bạn
                    </p>
                </div>

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                                    ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                                    }
                                `}
                            >
                                <span className="text-base">{tab.icon}</span>
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                Thông tin tài khoản
                            </h2>
                            <form onSubmit={handleProfileSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        Tên
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={profileForm.data.name}
                                        onChange={(e) => profileForm.setData('name', e.target.value)}
                                        className={`bg-white dark:bg-gray-700 border ${profileForm.errors.name ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600 block w-full px-3.5 py-2.5 transition-colors placeholder-gray-400 dark:placeholder-gray-500`}
                                        placeholder="Nhập tên của bạn"
                                        required
                                    />
                                    {profileForm.errors.name && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{profileForm.errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={profileForm.data.email}
                                        onChange={(e) => profileForm.setData('email', e.target.value)}
                                        className={`bg-white dark:bg-gray-700 border ${profileForm.errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600 block w-full px-3.5 py-2.5 transition-colors placeholder-gray-400 dark:placeholder-gray-500`}
                                        placeholder="name@example.com"
                                        required
                                    />
                                    {profileForm.errors.email && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{profileForm.errors.email}</p>
                                    )}
                                    {user.email_verified_at && (
                                        <p className="mt-1.5 text-sm text-green-600 dark:text-green-400 flex items-center space-x-1.5">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>Email đã được xác thực</span>
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={profileForm.processing}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 text-white font-medium rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {profileForm.processing ? (
                                            <span className="flex items-center space-x-2">
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Đang lưu...</span>
                                            </span>
                                        ) : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Password Tab */}
                    {activeTab === 'password' && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                Đổi mật khẩu
                            </h2>
                            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="current_password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        Mật khẩu hiện tại
                                    </label>
                                    <input
                                        type="password"
                                        id="current_password"
                                        value={passwordForm.data.current_password}
                                        onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                        className={`bg-white dark:bg-gray-700 border ${passwordForm.errors.current_password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600 block w-full px-3.5 py-2.5 transition-colors placeholder-gray-400 dark:placeholder-gray-500`}
                                        placeholder="••••••••"
                                        required
                                    />
                                    {passwordForm.errors.current_password && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{passwordForm.errors.current_password}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        Mật khẩu mới
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={passwordForm.data.password}
                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                        className={`bg-white dark:bg-gray-700 border ${passwordForm.errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600 block w-full px-3.5 py-2.5 transition-colors placeholder-gray-400 dark:placeholder-gray-500`}
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                    />
                                    {passwordForm.errors.password && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{passwordForm.errors.password[0]}</p>
                                    )}
                                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        Mật khẩu phải có ít nhất 8 ký tự
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="password_confirmation" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        Xác nhận mật khẩu mới
                                    </label>
                                    <input
                                        type="password"
                                        id="password_confirmation"
                                        value={passwordForm.data.password_confirmation}
                                        onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600 block w-full px-3.5 py-2.5 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={passwordForm.processing}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 text-white font-medium rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {passwordForm.processing ? (
                                            <span className="flex items-center space-x-2">
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Đang lưu...</span>
                                            </span>
                                        ) : 'Đổi mật khẩu'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* API Keys Tab */}
                    {activeTab === 'api-keys' && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                API Keys
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Thêm API keys để sử dụng các dịch vụ AI. API keys được mã hóa và lưu trữ an toàn.
                            </p>

                            <form onSubmit={handleApiKeysSubmit} className="space-y-6">
                                {/* OpenAI API Key */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label htmlFor="openai_api_key" className="block text-sm font-medium text-gray-900 dark:text-white">
                                            OpenAI API Key
                                        </label>
                                        {apiKeys.openai && (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                    Đã lưu: {apiKeys.openai}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowDeleteConfirm({ provider: 'openai' })}
                                                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="password"
                                        id="openai_api_key"
                                        value={apiKeysForm.data.openai_api_key}
                                        onChange={(e) => apiKeysForm.setData('openai_api_key', e.target.value)}
                                        placeholder={apiKeys.openai ? 'Nhập API key mới để cập nhật' : 'sk-...'}
                                        className={`bg-white dark:bg-gray-700 border ${apiKeysForm.errors.openai_api_key ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600 block w-full px-3.5 py-2.5 transition-colors placeholder-gray-400 dark:placeholder-gray-500 font-mono`}
                                    />
                                    {apiKeysForm.errors.openai_api_key && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{apiKeysForm.errors.openai_api_key}</p>
                                    )}
                                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        Lấy API key từ <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">OpenAI Platform</a>
                                    </p>
                                </div>

                                {/* Gemini API Key */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label htmlFor="gemini_api_key" className="block text-sm font-medium text-gray-900 dark:text-white">
                                            Google Gemini API Key
                                        </label>
                                        {apiKeys.gemini && (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                    Đã lưu: {apiKeys.gemini}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowDeleteConfirm({ provider: 'gemini' })}
                                                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="password"
                                        id="gemini_api_key"
                                        value={apiKeysForm.data.gemini_api_key}
                                        onChange={(e) => apiKeysForm.setData('gemini_api_key', e.target.value)}
                                        placeholder={apiKeys.gemini ? 'Nhập API key mới để cập nhật' : 'AIza...'}
                                        className={`bg-white dark:bg-gray-700 border ${apiKeysForm.errors.gemini_api_key ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600 block w-full px-3.5 py-2.5 transition-colors placeholder-gray-400 dark:placeholder-gray-500 font-mono`}
                                    />
                                    {apiKeysForm.errors.gemini_api_key && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{apiKeysForm.errors.gemini_api_key}</p>
                                    )}
                                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        Lấy API key từ <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Google AI Studio</a>
                                    </p>
                                </div>

                                {/* Claude API Key */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label htmlFor="claude_api_key" className="block text-sm font-medium text-gray-900 dark:text-white">
                                            Anthropic Claude API Key
                                        </label>
                                        {apiKeys.claude && (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                    Đã lưu: {apiKeys.claude}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowDeleteConfirm({ provider: 'claude' })}
                                                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="password"
                                        id="claude_api_key"
                                        value={apiKeysForm.data.claude_api_key}
                                        onChange={(e) => apiKeysForm.setData('claude_api_key', e.target.value)}
                                        placeholder={apiKeys.claude ? 'Nhập API key mới để cập nhật' : 'sk-ant-...'}
                                        className={`bg-white dark:bg-gray-700 border ${apiKeysForm.errors.claude_api_key ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600 block w-full px-3.5 py-2.5 transition-colors placeholder-gray-400 dark:placeholder-gray-500 font-mono`}
                                    />
                                    {apiKeysForm.errors.claude_api_key && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{apiKeysForm.errors.claude_api_key}</p>
                                    )}
                                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        Lấy API key từ <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Anthropic Console</a>
                                    </p>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={apiKeysForm.processing}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 text-white font-medium rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {apiKeysForm.processing ? (
                                            <span className="flex items-center space-x-2">
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Đang lưu...</span>
                                            </span>
                                        ) : 'Lưu API Keys'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm.provider && (
                <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Xác nhận xóa API Key
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 ml-[52px]">
                                Bạn có chắc chắn muốn xóa API key cho <span className="font-semibold text-gray-900 dark:text-white">{showDeleteConfirm.provider.toUpperCase()}</span>? Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowDeleteConfirm({ provider: null })}
                                    className="px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 transition-all font-medium text-sm"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => handleDeleteApiKey(showDeleteConfirm.provider)}
                                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 text-white rounded-lg transition-all font-medium text-sm"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>
    );
}

