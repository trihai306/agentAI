import React, { useState } from 'react';

/**
 * JSON Viewer Component với tree view, expand/collapse, search
 */
export default function JSONViewer({ data, collapsed = false }) {
    const [expanded, setExpanded] = useState(!collapsed);
    const [copied, setCopied] = useState(false);
    const [expandedPaths, setExpandedPaths] = useState(new Set());

    const handleCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const getPath = (key, level, parentPath = '') => {
        if (key === null) return parentPath;
        return parentPath ? `${parentPath}.${key}` : String(key);
    };

    const toggleExpand = (path) => {
        setExpandedPaths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) {
                newSet.delete(path);
            } else {
                newSet.add(path);
            }
            return newSet;
        });
    };

    const renderValue = (value, key = null, level = 0, parentPath = '') => {
        const indent = level * 16;
        const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
        const isArray = Array.isArray(value);
        const path = getPath(key, level, parentPath);
        // Auto-expand first 2 levels by default, unless explicitly collapsed
        const isExpanded = expandedPaths.has(path) || (level < 2 && expandedPaths.size === 0);

        if (isObject || isArray) {
            const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
            const type = isArray ? 'array' : 'object';
            const length = entries.length;

            return (
                <div key={key} className="my-1">
                    <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
                        <button
                            onClick={() => toggleExpand(path)}
                            className="mr-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                            <svg
                                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        {key !== null && (
                            <span className="text-blue-600 dark:text-blue-400 font-medium mr-2">"{key}":</span>
                        )}
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                            {type === 'array' ? '[' : '{'} {length} {type === 'array' ? 'items' : 'keys'}
                        </span>
                    </div>
                    {isExpanded && (
                        <div className="ml-4 border-l border-gray-300 dark:border-gray-600">
                            {entries.map(([k, v]) => (
                                <div key={k}>
                                    {renderValue(v, k, level + 1, path)}
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ paddingLeft: `${indent}px` }} className="text-gray-500 dark:text-gray-400 text-sm">
                        {type === 'array' ? ']' : '}'}
                    </div>
                </div>
            );
        }

        // Primitive value
        const valueType = typeof value;
        const valueColor = {
            string: 'text-green-600 dark:text-green-400',
            number: 'text-blue-600 dark:text-blue-400',
            boolean: 'text-purple-600 dark:text-purple-400',
            null: 'text-gray-500 dark:text-gray-400',
        }[valueType] || 'text-gray-900 dark:text-gray-300';

        const displayValue = value === null
            ? 'null'
            : valueType === 'string'
            ? `"${value}"`
            : String(value);

        return (
            <div key={key} className="flex items-center my-1" style={{ paddingLeft: `${indent}px` }}>
                {key !== null && (
                    <span className="text-blue-600 dark:text-blue-400 font-medium mr-2">"{key}":</span>
                )}
                <span className={valueColor}>{displayValue}</span>
                <button
                    onClick={() => handleCopy(displayValue)}
                    className="ml-2 opacity-0 group-hover:opacity-100 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-opacity"
                    title="Copy value"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>
            </div>
        );
    };

    let parsedData;
    try {
        parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
                Invalid JSON: {e.message}
            </div>
        );
    }

    return (
        <div className="group bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">JSON</span>
                <button
                    onClick={() => handleCopy(JSON.stringify(parsedData, null, 2))}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                    {copied ? (
                        <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <div className="font-mono text-sm">
                {renderValue(parsedData, null, 0, 'root')}
            </div>
        </div>
    );
}

