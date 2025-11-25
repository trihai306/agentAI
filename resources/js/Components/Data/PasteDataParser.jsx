import { useState } from 'react';

export default function PasteDataParser({ onDataParsed }) {
    const [pasteText, setPasteText] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [delimiter, setDelimiter] = useState('auto');
    const [hasHeaders, setHasHeaders] = useState(true);

    const detectDelimiter = (text) => {
        const lines = text.split('\n').slice(0, 5);
        if (lines.length === 0) return '\t';

        const tabCount = lines.reduce((sum, line) => sum + (line.match(/\t/g) || []).length, 0);
        const commaCount = lines.reduce((sum, line) => sum + (line.match(/,/g) || []).length, 0);
        const semicolonCount = lines.reduce((sum, line) => sum + (line.match(/;/g) || []).length, 0);

        if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
        if (semicolonCount > commaCount) return ';';
        return ',';
    };

    const parseData = () => {
        if (!pasteText.trim()) {
            return;
        }

        const lines = pasteText.trim().split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            return;
        }

        const detectedDelimiter = delimiter === 'auto' ? detectDelimiter(pasteText) : delimiter;
        const startIndex = hasHeaders ? 1 : 0;
        const headers = hasHeaders ? lines[0].split(detectedDelimiter).map(h => h.trim()) : null;

        const data = lines.slice(startIndex).map((line, index) => {
            const values = line.split(detectedDelimiter).map(v => v.trim());
            const item = {
                _rowIndex: index + startIndex,
            };

            if (headers) {
                headers.forEach((header, i) => {
                    if (header && values[i] !== undefined) {
                        item[header] = values[i];
                    }
                });
            } else {
                values.forEach((value, i) => {
                    item[`column_${i + 1}`] = value;
                });
            }

            return item;
        });

        setParsedData({
            headers: headers || Object.keys(data[0] || {}),
            data: data,
            delimiter: detectedDelimiter,
        });

        if (onDataParsed) {
            onDataParsed({
                headers: headers || Object.keys(data[0] || {}),
                data: data,
                delimiter: detectedDelimiter,
            });
        }
    };

    const handlePaste = (e) => {
        const text = e.clipboardData.getData('text');
        setPasteText(text);
        setTimeout(() => parseData(), 100);
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Dán dữ liệu từ Excel/Google Sheets
                </label>
                <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    onPaste={handlePaste}
                    onBlur={parseData}
                    placeholder="Copy và dán dữ liệu từ Excel hoặc Google Sheets vào đây..."
                    className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    rows={10}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Hỗ trợ: Tab-delimited (Excel), Comma-delimited (CSV), Semicolon-delimited
                </p>
            </div>

            <div className="flex items-center space-x-4">
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Dấu phân cách
                    </label>
                    <select
                        value={delimiter}
                        onChange={(e) => {
                            setDelimiter(e.target.value);
                            if (pasteText) {
                                setTimeout(() => parseData(), 100);
                            }
                        }}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                        <option value="auto">Tự động phát hiện</option>
                        <option value="\t">Tab</option>
                        <option value=",">Comma (,)</option>
                        <option value=";">Semicolon (;)</option>
                    </select>
                </div>
                <div className="flex items-center pt-6">
                    <input
                        type="checkbox"
                        id="hasHeaders"
                        checked={hasHeaders}
                        onChange={(e) => {
                            setHasHeaders(e.target.checked);
                            if (pasteText) {
                                setTimeout(() => parseData(), 100);
                            }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="hasHeaders" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                        Có header row
                    </label>
                </div>
            </div>

            {parsedData && parsedData.data.length > 0 && (
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Đã parse: {parsedData.data.length} rows
                        </span>
                        <button
                            onClick={() => {
                                setPasteText('');
                                setParsedData(null);
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            Xóa
                        </button>
                    </div>
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    {parsedData.headers.map((header, idx) => (
                                        <th key={idx} className="px-4 py-2 border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {parsedData.data.slice(0, 10).map((row, rowIdx) => (
                                    <tr key={rowIdx} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        {parsedData.headers.map((header, colIdx) => (
                                            <td key={colIdx} className="px-4 py-2 border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                                                {row[header] || '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {parsedData.data.length > 10 && (
                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
                                ... và {parsedData.data.length - 10} rows khác
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

