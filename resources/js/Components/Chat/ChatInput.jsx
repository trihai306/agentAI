import { useRef, useEffect } from 'react';

export default function ChatInput({ value, onChange, onSubmit, disabled, isLoading, onStop, currentStatus, thinkingMessage }) {
    const textareaRef = useRef(null);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isLoading) {
                onSubmit(e);
            }
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [value]);

    return (
        <form onSubmit={onSubmit} className="relative">
            <div className={`relative flex items-end bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 ${
                isLoading
                    ? 'border-gray-400 dark:border-gray-600 ring-2 ring-gray-200 dark:ring-gray-700'
                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 focus-within:border-gray-900 dark:focus-within:border-gray-100 focus-within:ring-2 focus-within:ring-gray-900 dark:focus-within:ring-gray-100'
            }`}>
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={disabled || isLoading}
                    placeholder={isLoading ? "AI đang xử lý..." : "Nhập tin nhắn của bạn..."}
                    rows={1}
                    className="w-full px-4 py-3 pr-14 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-0 text-base leading-6 disabled:opacity-70"
                    style={{ minHeight: '56px', maxHeight: '200px' }}
                />
                {isLoading ? (
                    <button
                        type="button"
                        onClick={onStop}
                        className="absolute right-2 bottom-2 p-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 transition-all duration-200 flex items-center justify-center group"
                        title="Dừng AI (Stop)"
                    >
                        <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M9 10h6v4H9z"
                            />
                        </svg>
                        <span className="absolute -top-10 right-0 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Dừng
                        </span>
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={disabled || !value.trim()}
                        className="absolute right-2 bottom-2 p-2.5 rounded-lg bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white dark:text-gray-900 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center disabled:opacity-50"
                        title="Gửi tin nhắn (Enter)"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Status indicator khi đang chạy - Professional */}
            {isLoading && (currentStatus || thinkingMessage) && (
                <div className="mt-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    {currentStatus && (
                        <div className="flex items-center space-x-3">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 dark:bg-gray-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-600 dark:bg-gray-400"></span>
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {currentStatus.status === 'thinking' || currentStatus.status === 'planning'
                                    ? 'Đang suy nghĩ...'
                                    : currentStatus.status === 'executing_tool'
                                    ? `${currentStatus.tool || 'Đang thực thi...'}`
                                    : currentStatus.message || 'Đang xử lý...'}
                            </span>
                        </div>
                    )}
                    {thinkingMessage && (
                        <div className="mt-2 px-3 py-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start space-x-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">💭</span>
                                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 leading-relaxed">
                                    {thinkingMessage}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>AI có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.</span>
            </div>
        </form>
    );
}

