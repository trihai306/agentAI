import React from 'react';

/**
 * Skeleton Loading Component cho Messages
 */
export default function MessageSkeleton({ isUser = false }) {
    return (
        <div className={`w-full ${isUser ? 'bg-gray-50 dark:bg-gray-800/30' : 'bg-white dark:bg-gray-900'} py-4 sm:py-5 animate-pulse border-b border-gray-200 dark:border-gray-700`}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-start space-x-4">
                {/* Avatar Skeleton */}
                <div className="shrink-0">
                    <div className={`w-10 h-10 rounded-full ${
                        isUser ? 'bg-gray-300 dark:bg-gray-700' : 'bg-gray-300 dark:bg-gray-700'
                    }`}></div>
                </div>

                {/* Content Skeleton */}
                <div className="flex-1 min-w-0 space-y-3">
                    {/* Text lines skeleton */}
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>

                    {/* Tool calls skeleton (if assistant) */}
                    {!isUser && (
                        <div className="mt-4 space-y-2">
                            <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"></div>
                            <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

