import { useState, useEffect } from 'react';

export default function TemplateForm({ onGenerate, collectionType = 'custom' }) {
    const [template, setTemplate] = useState({
        key: 'item_{{index}}',
        value: 'value_{{index}}',
        label: 'Item {{index}}',
        description: '',
        data_type: 'string',
        tags: '',
    });
    const [batchSize, setBatchSize] = useState(100);
    const [previewItems, setPreviewItems] = useState([]);
    const [startIndex, setStartIndex] = useState(1);

    // Predefined templates based on collection type
    const predefinedTemplates = {
        accounts: {
            key: 'username_{{index}}',
            value: 'user{{index}}@example.com',
            label: 'User {{index}}',
            description: 'Account {{index}}',
            data_type: 'string',
        },
        comments: {
            key: 'comment_{{index}}',
            value: 'Comment text {{index}}',
            label: 'Comment {{index}}',
            description: '',
            data_type: 'string',
        },
        posts: {
            key: 'post_{{index}}',
            value: 'Post content {{index}}',
            label: 'Post {{index}}',
            description: '',
            data_type: 'string',
        },
        products: {
            key: 'product_{{index}}',
            value: 'Product {{index}}',
            label: 'Product {{index}}',
            description: 'Product description {{index}}',
            data_type: 'string',
        },
    };

    useEffect(() => {
        if (predefinedTemplates[collectionType]) {
            setTemplate(predefinedTemplates[collectionType]);
        }
    }, [collectionType]);

    const processTemplate = (text, index) => {
        if (!text) return '';
        
        return text
            .replace(/\{\{index\}\}/g, index)
            .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('vi-VN'))
            .replace(/\{\{timestamp\}\}/g, Date.now())
            .replace(/\{\{random\((\d+),(\d+)\)\}\}/g, (match, min, max) => {
                return Math.floor(Math.random() * (parseInt(max) - parseInt(min) + 1)) + parseInt(min);
            })
            .replace(/\{\{random\}\}/g, () => Math.random().toString(36).substring(7));
    };

    const generatePreview = () => {
        const items = [];
        const previewCount = Math.min(batchSize, 10);
        
        for (let i = 0; i < previewCount; i++) {
            const index = startIndex + i;
            items.push({
                key: processTemplate(template.key, index),
                value: processTemplate(template.value, index),
                label: processTemplate(template.label, index),
                description: processTemplate(template.description, index),
                data_type: template.data_type,
                tags: template.tags ? template.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            });
        }
        
        setPreviewItems(items);
    };

    useEffect(() => {
        generatePreview();
    }, [template, batchSize, startIndex]);

    const handleGenerate = () => {
        const items = [];
        for (let i = 0; i < batchSize; i++) {
            const index = startIndex + i;
            items.push({
                key: processTemplate(template.key, index),
                value: processTemplate(template.value, index),
                label: processTemplate(template.label, index),
                description: processTemplate(template.description, index),
                data_type: template.data_type,
                tags: template.tags ? template.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                order: i,
            });
        }
        
        if (onGenerate) {
            onGenerate(items);
        }
    };

    return (
        <div className="space-y-6">
            {/* Template Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Key Pattern <span className="text-gray-500">({{index}}, {{date}}, {{timestamp}}, {{random}})</span>
                    </label>
                    <input
                        type="text"
                        value={template.key}
                        onChange={(e) => setTemplate({ ...template, key: e.target.value })}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="item_{{index}}"
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Value Pattern
                    </label>
                    <input
                        type="text"
                        value={template.value}
                        onChange={(e) => setTemplate({ ...template, value: e.target.value })}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="value_{{index}}"
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Label Pattern
                    </label>
                    <input
                        type="text"
                        value={template.label}
                        onChange={(e) => setTemplate({ ...template, label: e.target.value })}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Item {{index}}"
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Data Type
                    </label>
                    <select
                        value={template.data_type}
                        onChange={(e) => setTemplate({ ...template, data_type: e.target.value })}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="integer">Integer</option>
                        <option value="boolean">Boolean</option>
                        <option value="json">JSON</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Description Pattern (tùy chọn)
                    </label>
                    <input
                        type="text"
                        value={template.description}
                        onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Description {{index}}"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Tags (phân cách bằng dấu phẩy)
                    </label>
                    <input
                        type="text"
                        value={template.tags}
                        onChange={(e) => setTemplate({ ...template, tags: e.target.value })}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="tag1, tag2, tag3"
                    />
                </div>
            </div>

            {/* Batch Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Số lượng items
                    </label>
                    <select
                        value={batchSize}
                        onChange={(e) => setBatchSize(parseInt(e.target.value))}
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                        <option value={10}>10 items</option>
                        <option value={50}>50 items</option>
                        <option value={100}>100 items</option>
                        <option value={500}>500 items</option>
                        <option value={1000}>1000 items</option>
                        <option value={2000}>2000 items</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Bắt đầu từ số
                    </label>
                    <input
                        type="number"
                        value={startIndex}
                        onChange={(e) => setStartIndex(parseInt(e.target.value) || 1)}
                        min={1}
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Preview */}
            {previewItems.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            Preview (10 items đầu tiên)
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Tổng: {batchSize} items
                        </span>
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
                                {previewItems.map((item, idx) => (
                                    <tr key={idx} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                                            {item.key}
                                        </td>
                                        <td className="px-4 py-2">{item.value}</td>
                                        <td className="px-4 py-2">{item.label}</td>
                                        <td className="px-4 py-2">
                                            <span className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700">
                                                {item.data_type}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Generate Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleGenerate}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                    Tạo {batchSize} items
                </button>
            </div>
        </div>
    );
}

