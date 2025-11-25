import React, { useState, useEffect } from 'react';
import ConfirmDialog from '../Admin/ConfirmDialog';
import useConfirmDialog from '../../Hooks/useConfirmDialog';

/**
 * Chat Sidebar Component - Hiển thị lịch sử sessions và quick actions
 */
export default function ChatSidebar({
    sessions = [],
    activeSession,
    onSelectSession,
    onCreateSession,
    onDeleteSession,
    isOpen = true,
    onClose,
    currentDeviceId,
    onDeviceChange
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { confirmDialog, hideDialog, dialogProps } = useConfirmDialog();

    // Filter sessions by search query
    const filteredSessions = sessions.filter(session => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            (session.name || '').toLowerCase().includes(query) ||
            (session.session_id || '').toLowerCase().includes(query)
        );
    });

    // Group sessions by date
    const groupedSessions = filteredSessions.reduce((groups, session) => {
        const date = new Date(session.last_message_at || session.created_at || Date.now());
        const dateKey = date.toDateString();

        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(session);
        return groups;
    }, {});

    // Sort sessions within each group by last_message_at
    Object.keys(groupedSessions).forEach(dateKey => {
        groupedSessions[dateKey].sort((a, b) => {
            const dateA = new Date(a.last_message_at || a.created_at || 0);
            const dateB = new Date(b.last_message_at || b.created_at || 0);
            return dateB - dateA;
        });
    });

    // Sort date keys (newest first)
    const sortedDateKeys = Object.keys(groupedSessions).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB - dateA;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hôm nay';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Hôm qua';
        } else {
            return date.toLocaleDateString('vi-VN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isCollapsed) {

        return (
            <div className="fixed left-0 top-0 h-full w-12 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 flex flex-col items-center py-4">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Expand sidebar"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div className={`fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 flex flex-col transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
            {/* Header - Professional Design */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lịch sử Chat</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsCollapsed(true)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110"
                            title="Collapse sidebar"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 md:hidden"
                                title="Close sidebar"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Search - Professional Design */}
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm session..."
                        className="w-full px-4 py-2.5 pl-10 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 transition-all duration-200"
                    />
                    <svg className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* New Session Button - Professional Design */}
                <button
                    onClick={onCreateSession}
                    className="w-full mt-4 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Session mới</span>
                </button>
            </div>

            {/* Sessions List - Enhanced */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {filteredSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
                            {searchQuery ? 'Không tìm thấy session nào' : 'Chưa có session nào'}
                        </p>
                        {!searchQuery && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 text-center">Tạo session mới để bắt đầu</p>
                        )}
                    </div>
                ) : (
                    <div className="p-3 space-y-4">
                        {sortedDateKeys.map((dateKey) => {
                            const dateSessions = groupedSessions[dateKey];
                            return (
                            <div key={dateKey}>
                                <div className="px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
                                    <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                                    <span className="px-3">{formatDate(dateSessions[0].last_message_at || dateSessions[0].created_at)}</span>
                                    <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                                </div>
                                <div className="space-y-2">
                                    {dateSessions.map((session) => {
                                        const isActive = activeSession?.id === session.id;
                                        return (
                                            <div
                                                key={session.id}
                                                onClick={() => onSelectSession && onSelectSession(session)}
                                                className={`group relative px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                                    isActive
                                                        ? 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700'
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-1.5">
                                                            <div className={`w-2 h-2 rounded-full ${
                                                                isActive
                                                                    ? 'bg-blue-500 dark:bg-blue-400'
                                                                    : 'bg-gray-300 dark:bg-gray-600'
                                                            }`}></div>
                                                            <div className={`text-sm font-medium truncate ${
                                                                isActive
                                                                    ? 'text-gray-900 dark:text-white'
                                                                    : 'text-gray-900 dark:text-white'
                                                            }`}>
                                                                {session.name || 'Session không tên'}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 ml-4">
                                                            <span className="flex items-center space-x-1">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <span>{formatTime(session.last_message_at || session.created_at)}</span>
                                                            </span>
                                                            {session.message_count > 0 && (
                                                                <span className="flex items-center space-x-1">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                                    </svg>
                                                                    <span>{session.message_count}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onDeleteSession) {
                                                                confirmDialog({
                                                                    title: 'Xóa session',
                                                                    message: `Bạn có chắc chắn muốn xóa "${session.name || 'session này'}"?`,
                                                                    description: 'Hành động này không thể hoàn tác.',
                                                                    variant: 'danger',
                                                                    confirmLabel: 'Xóa',
                                                                    cancelLabel: 'Hủy',
                                                                    onConfirm: () => {
                                                                    onDeleteSession(session.id);
                                                                    },
                                                                });
                                                            }
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                                        title="Xóa session"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                        })}
                    </div>
                )}
            </div>

            {/* Footer - Device Info - Professional */}
            {currentDeviceId && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Thiết bị hiện tại</div>
                    <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white font-mono truncate flex-1">{currentDeviceId}</span>
                        {onDeviceChange && (
                            <button
                                onClick={onDeviceChange}
                                className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all duration-200"
                            >
                                Đổi
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogProps} />
        </div>
    );
}

