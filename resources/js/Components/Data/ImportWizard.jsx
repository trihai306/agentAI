import { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { toast } from '../../Utils/toast';

export default function ImportWizard({ onImport, onCancel }) {
    const [step, setStep] = useState(1);
    const [importSource, setImportSource] = useState('file'); // file, paste, api
    const [fileData, setFileData] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [columnMapping, setColumnMapping] = useState({});
    const [validationErrors, setValidationErrors] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        toast.error('Lỗi khi parse CSV: ' + results.errors[0].message);
                        return;
                    }
                    setFileData({ type: 'csv', data: results.data, headers: results.meta.fields });
                    setStep(2);
                },
                error: (error) => {
                    toast.error('Lỗi khi đọc file: ' + error.message);
                },
            });
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                if (jsonData.length === 0) {
                    toast.error('File Excel trống');
                    return;
                }

                const headers = jsonData[0];
                const rows = jsonData.slice(1).map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index] || '';
                    });
                    return obj;
                });

                setFileData({ type: 'excel', data: rows, headers: headers });
                setStep(2);
            };
            reader.readAsArrayBuffer(file);
        } else if (fileExtension === 'json') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    if (!Array.isArray(jsonData)) {
                        toast.error('File JSON phải là array');
                        return;
                    }
                    const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
                    setFileData({ type: 'json', data: jsonData, headers: headers });
                    setStep(2);
                } catch (error) {
                    toast.error('Lỗi khi parse JSON: ' + error.message);
                }
            };
            reader.readAsText(file);
        } else {
            toast.error('Định dạng file không được hỗ trợ. Vui lòng chọn CSV, Excel hoặc JSON');
        }
    };

    const autoMapColumns = () => {
        if (!fileData) return;

        const mapping = {};
        const standardFields = ['key', 'value', 'label', 'description', 'data_type', 'tags', 'order'];

        fileData.headers.forEach((header) => {
            const headerLower = header.toLowerCase().trim();
            // Try to match standard fields
            for (const field of standardFields) {
                if (headerLower.includes(field) || field.includes(headerLower)) {
                    mapping[header] = field;
                    break;
                }
            }
            // If no match, map to value by default
            if (!mapping[header]) {
                mapping[header] = 'value';
            }
        });

        setColumnMapping(mapping);
    };

    useEffect(() => {
        if (step === 2 && fileData && Object.keys(columnMapping).length === 0) {
            autoMapColumns();
        }
    }, [step, fileData]);

    const validateAndMap = () => {
        if (!fileData) return;

        const errors = [];
        const mappedData = fileData.data.map((row, index) => {
            const item = {};
            
            Object.entries(columnMapping).forEach(([sourceColumn, targetField]) => {
                if (targetField && targetField !== 'skip') {
                    item[targetField] = row[sourceColumn];
                }
            });

            // Validation
            if (!item.key && !item.value) {
                errors.push({ row: index + 1, message: 'Thiếu key hoặc value' });
            }

            // Auto-detect data type if not provided
            if (!item.data_type && item.value) {
                const value = item.value;
                if (typeof value === 'number' || !isNaN(value)) {
                    item.data_type = Number.isInteger(parseFloat(value)) ? 'integer' : 'number';
                } else if (value === 'true' || value === 'false') {
                    item.data_type = 'boolean';
                } else if (value.startsWith('{') || value.startsWith('[')) {
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

            return item;
        });

        setParsedData(mappedData);
        setValidationErrors(errors);
        setStep(3);
    };

    const handleImport = () => {
        if (onImport && parsedData) {
            onImport(parsedData);
        }
    };

    return (
        <div className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-6">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center flex-1">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                            step >= s
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                        }`}>
                            {step > s ? (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                s
                            )}
                        </div>
                        {s < 4 && (
                            <div className={`flex-1 h-0.5 mx-2 ${
                                step > s ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                            }`}></div>
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: Choose Source */}
            {step === 1 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Chọn nguồn dữ liệu
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => {
                                setImportSource('file');
                                fileInputRef.current?.click();
                            }}
                            className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-center"
                        >
                            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <div className="font-medium text-gray-900 dark:text-white">Upload File</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">CSV, Excel, JSON</div>
                        </button>
                        <button
                            onClick={() => setImportSource('paste')}
                            className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-center"
                        >
                            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <div className="font-medium text-gray-900 dark:text-white">Paste Data</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Copy từ Excel/Sheets</div>
                        </button>
                        <button
                            onClick={() => setImportSource('api')}
                            className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-center"
                        >
                            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div className="font-medium text-gray-900 dark:text-white">API Import</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Từ API endpoint</div>
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls,.json"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </div>
            )}

            {/* Step 2: Map Columns */}
            {step === 2 && fileData && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Map Columns ({fileData.data.length} rows)
                        </h3>
                        <button
                            onClick={autoMapColumns}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Auto-map
                        </button>
                    </div>
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-2">Source Column</th>
                                    <th className="px-4 py-2">Map To</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fileData.headers.map((header) => (
                                    <tr key={header} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                                            {header}
                                        </td>
                                        <td className="px-4 py-2">
                                            <select
                                                value={columnMapping[header] || 'skip'}
                                                onChange={(e) => setColumnMapping({
                                                    ...columnMapping,
                                                    [header]: e.target.value === 'skip' ? null : e.target.value,
                                                })}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            >
                                                <option value="skip">Skip</option>
                                                <option value="key">Key</option>
                                                <option value="value">Value</option>
                                                <option value="label">Label</option>
                                                <option value="description">Description</option>
                                                <option value="data_type">Data Type</option>
                                                <option value="tags">Tags</option>
                                                <option value="order">Order</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setStep(1)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            Quay lại
                        </button>
                        <button
                            onClick={validateAndMap}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            Tiếp theo
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Preview & Validate */}
            {step === 3 && parsedData && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Preview & Validation
                    </h3>
                    {validationErrors.length > 0 && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                                Có {validationErrors.length} lỗi validation
                            </div>
                            <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
                                {validationErrors.slice(0, 5).map((error, idx) => (
                                    <div key={idx}>Row {error.row}: {error.message}</div>
                                ))}
                                {validationErrors.length > 5 && (
                                    <div>... và {validationErrors.length - 5} lỗi khác</div>
                                )}
                            </div>
                        </div>
                    )}
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
                                {parsedData.slice(0, 10).map((item, idx) => (
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
                        {parsedData.length > 10 && (
                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
                                ... và {parsedData.length - 10} items khác
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setStep(2)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            Quay lại
                        </button>
                        <button
                            onClick={handleImport}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            Import {parsedData.length} items
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

