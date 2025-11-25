import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import TemplateForm from './TemplateForm';
import ImportWizard from './ImportWizard';
import PasteDataParser from './PasteDataParser';
import BatchProcessor from './BatchProcessor';
import route from '../../Utils/route';
import { toast } from '../../Utils/toast';

export default function BulkItemCreator({ 
    collectionId, 
    collectionType = 'custom',
    isOpen, 
    onClose 
}) {
    const [activeTab, setActiveTab] = useState('template'); // template, import, paste, api
    const [itemsToImport, setItemsToImport] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({
        total: 0,
        processed: 0,
        success: 0,
        error: 0,
        errors: [],
        status: 'idle',
    });

    // Initialize Flowbite
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Flowbite && isOpen) {
            window.Flowbite.init();
        }
    }, [isOpen]);

    const handleTemplateGenerate = (items) => {
        setItemsToImport(items);
        setActiveTab('preview');
    };

    const handleImportData = (items) => {
        setItemsToImport(items);
        setActiveTab('preview');
    };

    const handlePasteData = (parsedData) => {
        if (!parsedData || !parsedData.data) return;

        // Convert parsed data to items format
        const items = parsedData.data.map((row, index) => {
            const item = {};
            
            // Try to map common column names
            Object.keys(row).forEach(key => {
                const keyLower = key.toLowerCase();
                if (keyLower.includes('key') || keyLower === 'key') {
                    item.key = row[key];
                } else if (keyLower.includes('value') || keyLower === 'value') {
                    item.value = row[key];
                } else if (keyLower.includes('label') || keyLower === 'label') {
                    item.label = row[key];
                } else if (keyLower.includes('description') || keyLower === 'description') {
                    item.description = row[key];
                } else if (keyLower.includes('type') || keyLower === 'type' || keyLower === 'data_type') {
                    item.data_type = row[key];
                } else if (keyLower.includes('tag') || keyLower === 'tags') {
                    item.tags = typeof row[key] === 'string' ? row[key].split(',').map(t => t.trim()) : row[key];
                } else {
                    // Default to value if not mapped
                    if (!item.value) {
                        item.value = row[key];
                    }
                }
            });

            // Ensure at least key or value
            if (!item.key && !item.value) {
                item.value = JSON.stringify(row);
            }

            // Auto-detect data type
            if (!item.data_type && item.value) {
                const value = item.value;
                if (typeof value === 'number' || !isNaN(value)) {
                    item.data_type = Number.isInteger(parseFloat(value)) ? 'integer' : 'number';
                } else if (value === 'true' || value === 'false') {
                    item.data_type = 'boolean';
                } else if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                    try {
                        JSON.parse(value);
                        item.data_type = 'json';
                    } catch {
                        item.data_type = 'string';
                    }
                } else {
                    item.data_type = 'string';
                }
            }

            item.order = index;
            return item;
        });

        setItemsToImport(items);
        setActiveTab('preview');
    };

    const processBatch = async (items, chunkSize = 100) => {
        setIsProcessing(true);
        setProgress({
            total: items.length,
            processed: 0,
            success: 0,
            error: 0,
            errors: [],
            status: 'processing',
        });

        const chunks = [];
        for (let i = 0; i < items.length; i += chunkSize) {
            chunks.push(items.slice(i, i + chunkSize));
        }

        let totalProcessed = 0;
        let totalSuccess = 0;
        let totalErrors = [];

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            
            try {
                const response = await fetch(route('user.data.items.bulk-import', collectionId), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({ items: chunk }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    totalSuccess += chunk.length;
                    totalProcessed += chunk.length;
                } else {
                    chunk.forEach((item, idx) => {
                        totalErrors.push({
                            row: chunkIndex * chunkSize + idx + 1,
                            message: data.message || 'Lỗi không xác định',
                        });
                    });
                    totalProcessed += chunk.length;
                }
            } catch (error) {
                chunk.forEach((item, idx) => {
                    totalErrors.push({
                        row: chunkIndex * chunkSize + idx + 1,
                        message: error.message || 'Lỗi network',
                    });
                });
                totalProcessed += chunk.length;
            }

            setProgress({
                total: items.length,
                processed: totalProcessed,
                success: totalSuccess,
                error: totalErrors.length,
                errors: totalErrors,
                status: chunkIndex < chunks.length - 1 ? 'processing' : 'completed',
            });

            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        setIsProcessing(false);
        
        if (totalErrors.length === 0) {
            toast.success(`Đã import thành công ${totalSuccess} items`);
            onClose();
            router.reload({ only: ['items', 'collection'] });
        } else {
            toast.warning(`Đã import ${totalSuccess} items, ${totalErrors.length} items có lỗi`);
        }
    };

    const handleConfirmImport = () => {
        if (itemsToImport.length === 0) {
            toast.warning('Không có dữ liệu để import');
            return;
        }
        processBatch(itemsToImport);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/75 z-50"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div
                id="bulk-item-creator-modal"
                tabIndex="-1"
                className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto"
            >
                <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow dark:bg-gray-800">
                    {/* Modal header */}
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Tạo dữ liệu hàng loạt
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="sr-only">Close modal</span>
                        </button>
                    </div>

                    {/* Modal body */}
                    <div className="p-4 md:p-5 max-h-[70vh] overflow-y-auto">
                        {isProcessing ? (
                            <BatchProcessor
                                totalItems={progress.total}
                                processedItems={progress.processed}
                                successCount={progress.success}
                                errorCount={progress.error}
                                errors={progress.errors}
                                isProcessing={isProcessing}
                                onCancel={() => {
                                    setIsProcessing(false);
                                    setProgress({ ...progress, status: 'idle' });
                                }}
                                status={progress.status}
                            />
                        ) : activeTab === 'preview' ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Preview ({itemsToImport.length} items)
                                    </h4>
                                    <button
                                        onClick={() => setActiveTab('template')}
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Quay lại
                                    </button>
                                </div>
                                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                            <tr>
                                                <th className="px-4 py-2">Key</th>
                                                <th className="px-4 py-2">Value</th>
                                                <th className="px-4 py-2">Label</th>
                                                <th className="px-4 py-2">Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemsToImport.slice(0, 20).map((item, idx) => (
                                                <tr key={idx} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                                                        {item.key || '-'}
                                                    </td>
                                                    <td className="px-4 py-2">{String(item.value || '-').substring(0, 50)}</td>
                                                    <td className="px-4 py-2">{item.label || '-'}</td>
                                                    <td className="px-4 py-2">
                                                        <span className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700">
                                                            {item.data_type || 'string'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {itemsToImport.length > 20 && (
                                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
                                            ... và {itemsToImport.length - 20} items khác
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setActiveTab('template')}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleConfirmImport}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
                                    >
                                        Import {itemsToImport.length} items
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Tabs */}
                                <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400 mb-4">
                                    <li className="me-2">
                                        <button
                                            onClick={() => setActiveTab('template')}
                                            className={`inline-block p-4 rounded-t-lg ${
                                                activeTab === 'template'
                                                    ? 'text-blue-600 bg-gray-100 dark:bg-gray-800 dark:text-blue-500'
                                                    : 'hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300'
                                            }`}
                                        >
                                            Template
                                        </button>
                                    </li>
                                    <li className="me-2">
                                        <button
                                            onClick={() => setActiveTab('import')}
                                            className={`inline-block p-4 rounded-t-lg ${
                                                activeTab === 'import'
                                                    ? 'text-blue-600 bg-gray-100 dark:bg-gray-800 dark:text-blue-500'
                                                    : 'hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300'
                                            }`}
                                        >
                                            Import File
                                        </button>
                                    </li>
                                    <li className="me-2">
                                        <button
                                            onClick={() => setActiveTab('paste')}
                                            className={`inline-block p-4 rounded-t-lg ${
                                                activeTab === 'paste'
                                                    ? 'text-blue-600 bg-gray-100 dark:bg-gray-800 dark:text-blue-500'
                                                    : 'hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300'
                                            }`}
                                        >
                                            Paste Data
                                        </button>
                                    </li>
                                </ul>

                                {/* Tab Content */}
                                {activeTab === 'template' && (
                                    <TemplateForm
                                        onGenerate={handleTemplateGenerate}
                                        collectionType={collectionType}
                                    />
                                )}

                                {activeTab === 'import' && (
                                    <ImportWizard
                                        onImport={handleImportData}
                                        onCancel={onClose}
                                    />
                                )}

                                {activeTab === 'paste' && (
                                    <PasteDataParser
                                        onDataParsed={handlePasteData}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

