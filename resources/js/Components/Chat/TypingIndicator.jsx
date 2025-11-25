import React from 'react';

/**
 * Typing indicator component hiển thị khi agent đang stream text
 */
export default function TypingIndicator({ isVisible = true }) {
    if (!isVisible) return null;

    return (
        <div className="flex items-center space-x-2 py-2 px-3">
            <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Đang suy nghĩ...</span>
        </div>
    );
}

