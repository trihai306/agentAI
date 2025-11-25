import React from 'react';

/**
 * Smart Content Renderer - Auto-detect và format các loại content
 * Detects: code blocks, JSON, URLs, commands, file paths, numbers, dates
 */
export default function SmartContentRenderer({ content }) {
    if (!content || typeof content !== 'string') {
        return <div className="text-gray-900 dark:text-gray-100">{content}</div>;
    }

    // Detect code blocks (```language ... ```)
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        // Add text before code block
        if (match.index > lastIndex) {
            const beforeText = content.substring(lastIndex, match.index);
            if (beforeText.trim()) {
                parts.push({ type: 'text', content: beforeText });
            }
        }

        // Add code block
        const language = match[1] || 'text';
        const code = match[2].trim();
        parts.push({ type: 'code', language, content: code });

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
        const afterText = content.substring(lastIndex);
        if (afterText.trim()) {
            parts.push({ type: 'text', content: afterText });
        }
    }

    // If no code blocks found, return original content
    if (parts.length === 0) {
        parts.push({ type: 'text', content });
    }

    // Render text with smart formatting
    const renderText = (text) => {
        // Detect URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urlParts = [];
        let urlLastIndex = 0;
        let urlMatch;

        while ((urlMatch = urlRegex.exec(text)) !== null) {
            if (urlMatch.index > urlLastIndex) {
                urlParts.push({ type: 'text', content: text.substring(urlLastIndex, urlMatch.index) });
            }
            urlParts.push({ type: 'url', content: urlMatch[0] });
            urlLastIndex = urlMatch.index + urlMatch[0].length;
        }

        if (urlLastIndex < text.length) {
            urlParts.push({ type: 'text', content: text.substring(urlLastIndex) });
        }

        if (urlParts.length === 0) {
            urlParts.push({ type: 'text', content: text });
        }

        return urlParts.map((part, idx) => {
            if (part.type === 'url') {
                return (
                    <a
                        key={idx}
                        href={part.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline break-all"
                    >
                        {part.content}
                    </a>
                );
            }
            return <span key={idx}>{part.content}</span>;
        });
    };

    // Try to detect JSON in text
    const detectJSON = (text) => {
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return { isJSON: true, json: parsed, match: jsonMatch[0] };
            }
        } catch (e) {
            // Not valid JSON
        }
        return { isJSON: false };
    };

    return (
        <div className="space-y-2">
            {parts.map((part, index) => {
                if (part.type === 'code') {
                    // Code block - will be handled by CodeBlock component
                    return (
                        <div key={index} className="my-3">
                            {/* Placeholder - will be replaced by CodeBlock component */}
                            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
                                <code className="text-sm text-gray-900 dark:text-gray-300 font-mono">{part.content}</code>
                            </pre>
                        </div>
                    );
                } else if (part.type === 'text') {
                    // Check if text contains JSON
                    const jsonInfo = detectJSON(part.content);
                    if (jsonInfo.isJSON) {
                        // Split text around JSON
                        const jsonIndex = part.content.indexOf(jsonInfo.match);
                        const beforeJSON = part.content.substring(0, jsonIndex);
                        const afterJSON = part.content.substring(jsonIndex + jsonInfo.match.length);

                        return (
                            <div key={index} className="space-y-2">
                                {beforeJSON && <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{renderText(beforeJSON)}</div>}
                                <div className="my-2">
                                    {/* JSON will be handled by JSONViewer component */}
                                    <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
                                        <code className="text-sm text-gray-900 dark:text-gray-300 font-mono">
                                            {JSON.stringify(jsonInfo.json, null, 2)}
                                        </code>
                                    </pre>
                                </div>
                                {afterJSON && <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{renderText(afterJSON)}</div>}
                            </div>
                        );
                    }

                    // Regular text with URL detection
                    return (
                        <div key={index} className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
                            {renderText(part.content)}
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
}

