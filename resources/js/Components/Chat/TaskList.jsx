import React, { useState, useEffect, useRef } from 'react';

/**
 * TaskList Component - Hiển thị danh sách tasks/plan của agent
 * Professional design với animations, auto-scroll, và smart features
 */
export default function TaskList({ tasks = [], isComplete = false, currentStep = 0 }) {
    const [expandedTasks, setExpandedTasks] = useState(new Set());
    const [taskStartTimes, setTaskStartTimes] = useState(new Map());
    const activeTaskRef = useRef(null);
    const containerRef = useRef(null);

    // Track task start times
    useEffect(() => {
        if (tasks && tasks.length > 0) {
            setTaskStartTimes(prev => {
                const newMap = new Map(prev);
                tasks.forEach((task, index) => {
                    const taskId = task.stepNumber || index;
                    if (index === currentStep && !newMap.has(taskId)) {
                        newMap.set(taskId, Date.now());
                    }
                });
                return newMap;
            });
        }
    }, [tasks, currentStep]);

    // Auto-scroll to active task
    useEffect(() => {
        if (activeTaskRef.current && containerRef.current) {
            const container = containerRef.current;
            const activeElement = activeTaskRef.current;
            const containerRect = container.getBoundingClientRect();
            const activeRect = activeElement.getBoundingClientRect();
            
            const scrollTop = container.scrollTop;
            const activeTop = activeRect.top - containerRect.top + scrollTop;
            const activeBottom = activeRect.bottom - containerRect.top + scrollTop;
            const containerHeight = container.clientHeight;

            // Scroll if active task is not fully visible
            if (activeTop < scrollTop) {
                container.scrollTo({
                    top: activeTop - 20,
                    behavior: 'smooth'
                });
            } else if (activeBottom > scrollTop + containerHeight) {
                container.scrollTo({
                    top: activeBottom - containerHeight + 20,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentStep, tasks]);

    // Auto-expand active task
    useEffect(() => {
        if (currentStep >= 0 && tasks && tasks[currentStep]) {
            setExpandedTasks(prev => new Set([...prev, currentStep]));
        }
    }, [currentStep, tasks]);

    const toggleTask = (index) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const getTaskIcon = (task, index) => {
        const description = (task.description || task.action || '').toLowerCase();
        
        if (description.includes('screenshot') || description.includes('chụp')) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            );
        }
        if (description.includes('click') || description.includes('tap') || description.includes('ấn')) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
            );
        }
        if (description.includes('swipe') || description.includes('vuốt') || description.includes('scroll')) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
            );
        }
        if (description.includes('type') || description.includes('nhập') || description.includes('input')) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            );
        }
        if (description.includes('find') || description.includes('tìm') || description.includes('search')) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            );
        }
        if (description.includes('verify') || description.includes('kiểm tra') || description.includes('check')) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        }
        if (description.includes('wait') || description.includes('đợi') || description.includes('delay')) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        }
        // Default icon
        return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        );
    };

    const getTaskDuration = (task, index) => {
        const taskId = task.stepNumber || index;
        const startTime = taskStartTimes.get(taskId);
        if (startTime && index === currentStep) {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            if (duration < 60) return `${duration}s`;
            return `${Math.floor(duration / 60)}m ${duration % 60}s`;
        }
        return null;
    };

    const completedCount = tasks.filter(t => t.completed || tasks.indexOf(t) < currentStep).length;
    const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

    if (!tasks || tasks.length === 0) {
        return (
            <div className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Task List</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Agent's execution plan</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Chưa có task nào</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Agent sẽ hiển thị plan khi bắt đầu</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            {/* Header - Professional */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Task List</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Execution Plan</p>
                        </div>
                    </div>
                    {isComplete && (
                        <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 animate-pulse">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Hoàn thành
                        </div>
                    )}
                </div>
                
                {/* Progress Bar - Enhanced */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Tiến độ</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                            {completedCount} / {tasks.length}
                        </span>
                    </div>
                    <div className="relative w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out shadow-lg"
                            style={{ width: `${progressPercentage}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task List - Scrollable */}
            <div 
                ref={containerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
            >
                {tasks.map((task, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = task.completed || index < currentStep;
                    const isExpanded = expandedTasks.has(index);
                    const duration = getTaskDuration(task, index);
                    const taskId = task.stepNumber || index;

                    return (
                        <div
                            key={taskId}
                            ref={isActive ? activeTaskRef : null}
                            className={`
                                group relative rounded-xl border-2 transition-all duration-300 transform
                                ${isActive 
                                    ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 shadow-lg shadow-blue-500/20 scale-[1.02] ring-2 ring-blue-500/20' 
                                    : isCompleted
                                        ? 'border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 hover:shadow-md'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                                }
                            `}
                        >
                            {/* Active Task Pulse Animation */}
                            {isActive && (
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-20 blur-sm animate-pulse"></div>
                            )}

                            <div className="relative p-4">
                                <div className="flex items-start gap-3">
                                    {/* Status Icon - Enhanced */}
                                    <div className="flex-shrink-0 mt-0.5">
                                        {isCompleted ? (
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        ) : isActive ? (
                                            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 animate-ping opacity-75"></div>
                                                <div className="relative w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center font-semibold text-sm text-gray-600 dark:text-gray-400">
                                                {task.stepNumber || index + 1}
                                            </div>
                                        )}
                                    </div>

                                    {/* Task Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                                {/* Task Type Icon */}
                                                <div className={`flex-shrink-0 mt-0.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                    {getTaskIcon(task, index)}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`
                                                        text-sm font-semibold leading-snug
                                                        ${isActive 
                                                            ? 'text-blue-900 dark:text-blue-100' 
                                                            : isCompleted
                                                                ? 'text-green-900 dark:text-green-100'
                                                                : 'text-gray-900 dark:text-gray-100'
                                                        }
                                                    `}>
                                                        {task.description || task.action || `Task ${index + 1}`}
                                                    </h4>
                                                    
                                                    {/* Duration Badge */}
                                                    {duration && (
                                                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {duration}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expand Button */}
                                            {(task.reasoning || task.expectedResult || task.action) && (
                                                <button
                                                    onClick={() => toggleTask(index)}
                                                    className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                                                        isActive 
                                                            ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                                                            : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    <svg 
                                                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (task.reasoning || task.expectedResult || task.action) && (
                                            <div className="mt-3 space-y-2 pl-7 animate-fadeIn">
                                                {task.reasoning && (
                                                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                            </svg>
                                                            Lý do
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                                            {task.reasoning}
                                                        </p>
                                                    </div>
                                                )}

                                                {task.expectedResult && (
                                                    <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                                                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1.5">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Kỳ vọng
                                                        </p>
                                                        <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed italic">
                                                            {task.expectedResult}
                                                        </p>
                                                    </div>
                                                )}

                                                {task.action && (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        {task.action}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Summary */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="font-medium">
                            {isComplete ? 'Tất cả hoàn thành' : `${tasks.length - completedCount} task còn lại`}
                        </span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-500 font-mono">
                        {Math.round(progressPercentage)}%
                    </div>
                </div>
            </div>
        </div>
    );
}
