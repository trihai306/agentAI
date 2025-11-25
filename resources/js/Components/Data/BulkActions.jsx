import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from '../../Utils/toast';
import route from '../../Utils/route';

export default function BulkActions({
    selectedIds = [],
    onClearSelection,
    onActionComplete
}) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    if (selectedIds.length === 0) {
        return null;
    }

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;

        setIsProcessing(true);
        router.post(route('user.data.bulk-delete'), {
            ids: selectedIds
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Đã xóa ${selectedIds.length} collection(s) thành công`);
                onClearSelection?.();
                onActionComplete?.();
                setShowDeleteConfirm(false);
            },
            onError: () => {
                toast.error('Lỗi khi xóa collections');
            },
            onFinish: () => {
                setIsProcessing(false);
            }
        });
    };

    const handleBulkExport = (format) => {
        if (selectedIds.length === 0) return;

        const url = format === 'json'
            ? route('user.data.bulk-export.json') + `?ids=${selectedIds.join(',')}`
            : route('user.data.bulk-export.csv') + `?ids=${selectedIds.join(',')}`;

        window.open(url, '_blank');
        toast.success(`Đang tải xuống ${format.toUpperCase()}...`);
    };

    const handleBulkToggleStatus = (status) => {
        if (selectedIds.length === 0) return;

        setIsProcessing(true);
        router.post(route('user.data.bulk-toggle-status'), {
            ids: selectedIds,
            is_active: status
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Đã cập nhật trạng thái ${selectedIds.length} collection(s) thành công`);
                onClearSelection?.();
                onActionComplete?.();
            },
            onError: () => {
                toast.error('Lỗi khi cập nhật trạng thái');
            },
            onFinish: () => {
                setIsProcessing(false);
            }
        });
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                        {selectedIds.length}
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {selectedIds.length} collection{selectedIds.length > 1 ? 's' : ''} đã chọn
                                </span>
                            </div>
                            <button
                                onClick={onClearSelection}
                                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            >
                                Bỏ chọn tất cả
                            </button>
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* Export Actions */}
                            <div className="relative group">
                                <button
                                    disabled={isProcessing}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span>Export</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className="absolute bottom-full right-0 mb-2 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                    <button
                                        onClick={() => handleBulkExport('json')}
                                        className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg flex items-center space-x-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span>Export JSON</span>
                                    </button>
                                    <button
                                        onClick={() => handleBulkExport('csv')}
                                        className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-b-lg flex items-center space-x-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span>Export CSV</span>
                                    </button>
                                </div>
                            </div>

                            {/* Toggle Status */}
                            <button
                                onClick={() => handleBulkToggleStatus(true)}
                                disabled={isProcessing}
                                className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Kích hoạt</span>
                            </button>

                            <button
                                onClick={() => handleBulkToggleStatus(false)}
                                disabled={isProcessing}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>Tạm dừng</span>
                            </button>

                            {/* Delete Button */}
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={isProcessing}
                                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>Xóa</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
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
                                    Xác nhận xóa
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 ml-[52px]">
                                Bạn có chắc chắn muốn xóa <span className="font-semibold text-gray-900 dark:text-white">{selectedIds.length}</span> collection{selectedIds.length > 1 ? 's' : ''}? Tất cả items trong các collection này sẽ bị xóa. Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isProcessing}
                                    className="px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 transition-all font-medium text-sm disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isProcessing}
                                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 text-white rounded-lg transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {isProcessing && (
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    <span>Xóa</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

