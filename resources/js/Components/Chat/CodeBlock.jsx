import React, { useState } from 'react';

/**
 * Code Block Component với syntax highlighting
 * Supports: language detection, copy button, line numbers
 */
export default function CodeBlock({ code, language = 'text', showLineNumbers = false }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Simple syntax highlighting colors (fallback if no library)
    const getLanguageColor = (lang) => {
        const colors = {
            javascript: 'text-yellow-400',
            typescript: 'text-blue-400',
            python: 'text-green-400',
            json: 'text-purple-400',
            bash: 'text-green-300',
            shell: 'text-green-300',
            html: 'text-orange-400',
            css: 'text-blue-300',
            java: 'text-red-400',
            cpp: 'text-blue-400',
            c: 'text-blue-400',
        };
        return colors[lang?.toLowerCase()] || 'text-gray-300';
    };

    const lines = code.split('\n');
    const languageDisplay = language && language !== 'text' ? language : 'code';

    return (
        <div className="relative my-4 group">
            {/* Header with language and copy button */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
                <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium ${getLanguageColor(language)}`}>
                        {languageDisplay}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Copy code"
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

            {/* Code content */}
            <div className="relative bg-gray-50 dark:bg-gray-900 rounded-b-lg border border-gray-200 dark:border-gray-700 border-t-0 overflow-hidden">
                <pre className="p-4 overflow-x-auto">
                    <code className={`text-sm font-mono ${getLanguageColor(language)}`}>
                        {showLineNumbers ? (
                            <div className="flex">
                                <div className="select-none text-gray-400 dark:text-gray-600 pr-4 text-right">
                                    {lines.map((_, i) => (
                                        <div key={i}>{i + 1}</div>
                                    ))}
                                </div>
                                <div className="flex-1">
                                    {lines.map((line, i) => (
                                        <div key={i}>{line || '\u00A0'}</div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            code
                        )}
                    </code>
                </pre>
            </div>
        </div>
    );
}

