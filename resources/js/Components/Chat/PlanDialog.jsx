import React, { useState, useEffect } from 'react';

/**
 * PlanDialog Component - Professional dialog to display agent's execution plan
 * Hiển thị plan trong một modal chuyên nghiệp với animations và smart features
 */
export default function PlanDialog({ 
    plan, 
    isOpen, 
    onClose,
    nextAction = null,
    isComplete = false,
    summary = null 
}) {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen || !plan) return null;

    const steps = plan.steps || [];
    const currentStep = plan.currentStep || 0;
    const context = plan.context || {};
    const completedCount = steps.filter((s, i) => s.completed || i < currentStep).length;
    const progressPercentage = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            
            {/* Dialog */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div 
                    className={`
                        relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
                        transform transition-all duration-300
                        ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
                    `}
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Execution Plan
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                        {plan.goal || 'Agent execution plan'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isComplete && (
                                    <div className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold shadow-md flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Completed
                                    </div>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {steps.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Progress</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {completedCount} / {steps.length} steps
                                    </span>
                                </div>
                                <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out shadow-lg"
                                        style={{ width: `${progressPercentage}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {/* Context Info */}
                        {context && Object.keys(context).length > 0 && (
                            <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Context
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                    {context.currentScreen && (
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Screen:</span>
                                            <span className="ml-1 font-medium text-gray-900 dark:text-white">{context.currentScreen}</span>
                                        </div>
                                    )}
                                    {context.itemsCollected !== undefined && (
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Items:</span>
                                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                                {context.itemsCollected}{context.targetQuantity ? ` / ${context.targetQuantity}` : ''}
                                            </span>
                                        </div>
                                    )}
                                    {context.appOpened !== undefined && (
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">App:</span>
                                            <span className={`ml-1 font-medium ${context.appOpened ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {context.appOpened ? 'Opened' : 'Closed'}
                                            </span>
                                        </div>
                                    )}
                                    {context.hasModal && (
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Modal:</span>
                                            <span className="ml-1 font-medium text-orange-600 dark:text-orange-400">Active</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Steps List */}
                        <div className="space-y-3">
                            {steps.map((step, index) => {
                                const isActive = index === currentStep;
                                const isCompleted = step.completed || index < currentStep;

                                return (
                                    <div
                                        key={step.stepNumber || index}
                                        className={`
                                            group relative rounded-xl border-2 transition-all duration-300 p-4
                                            ${isActive 
                                                ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/20' 
                                                : isCompleted
                                                    ? 'border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10'
                                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                            }
                                        `}
                                    >
                                        {/* Active Pulse */}
                                        {isActive && (
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-20 blur-sm animate-pulse"></div>
                                        )}

                                        <div className="relative flex items-start gap-4">
                                            {/* Status Icon */}
                                            <div className="flex-shrink-0">
                                                {isCompleted ? (
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
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
                                                        {step.stepNumber || index + 1}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Step Content */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`
                                                    text-base font-semibold mb-2
                                                    ${isActive 
                                                        ? 'text-blue-900 dark:text-blue-100' 
                                                        : isCompleted
                                                            ? 'text-green-900 dark:text-green-100'
                                                            : 'text-gray-900 dark:text-gray-100'
                                                    }
                                                `}>
                                                    {step.description || step.action || `Step ${index + 1}`}
                                                </h4>
                                                
                                                {step.reasoning && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                        {step.reasoning}
                                                    </p>
                                                )}

                                                {step.expectedResult && (
                                                    <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                                                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Expected Result:</p>
                                                        <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                                                            {step.expectedResult}
                                                        </p>
                                                    </div>
                                                )}

                                                {step.action && (
                                                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        {step.action}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Next Action */}
                        {nextAction && !isComplete && (
                            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800">
                                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Next Action
                                </h3>
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    {nextAction.action || nextAction.description}
                                </p>
                                {nextAction.reasoning && (
                                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1 italic">
                                        {nextAction.reasoning}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Summary */}
                        {summary && (
                            <div className="mt-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                                <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">Summary</h3>
                                <p className="text-sm text-green-800 dark:text-green-200">{summary}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>
                                    {isComplete ? 'All steps completed' : `${steps.length - completedCount} steps remaining`}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

