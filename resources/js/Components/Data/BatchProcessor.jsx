import { useEffect, useState } from 'react';

export default function BatchProcessor({ 
    totalItems = 0, 
    processedItems = 0, 
    successCount = 0, 
    errorCount = 0, 
    errors = [],
    isProcessing = false,
    onCancel = null,
    status = 'idle' // idle, processing, completed, error
}) {
    const progress = totalItems > 0 ? Math.round((processedItems / totalItems) * 100) : 0;

    const getStatusColor = () => {
        switch (status) {
            case 'processing':
                return 'bg-blue-600';
            case 'completed':
                return 'bg-green-600';
            case 'error':
                return 'bg-red-600';
            default:
                return 'bg-gray-600';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'processing':
                return 'Đang xử lý...';
            case 'completed':
                return 'Hoàn thành';
            case 'error':
                return 'Có lỗi xảy ra';
            default:
                return 'Chờ xử lý';
        }
    };

    return (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Tiến trình xử lý
                </h3>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                    {getStatusText()}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {processedItems} / {totalItems} items
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {progress}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                        className={`${getStatusColor()} h-2.5 rounded-full transition-all duration-300`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {processedItems}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Đã xử lý
                    </div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {successCount}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Thành công
                    </div>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {errorCount}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Lỗi
                    </div>
                </div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-red-600 dark:text-red-400">
                            Lỗi ({errors.length})
                        </h4>
                        <button
                            onClick={() => {/* Collapse errors */}}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            Thu gọn
                        </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                        {errors.slice(0, 10).map((error, idx) => (
                            <div
                                key={idx}
                                className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-800 dark:text-red-200"
                            >
                                <div className="font-medium">Row {error.row || idx + 1}:</div>
                                <div>{error.message || 'Lỗi không xác định'}</div>
                            </div>
                        ))}
                        {errors.length > 10 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                                ... và {errors.length - 10} lỗi khác
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Cancel Button */}
            {isProcessing && onCancel && (
                <div className="flex justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                    >
                        Hủy
                    </button>
                </div>
            )}
        </div>
    );
}

