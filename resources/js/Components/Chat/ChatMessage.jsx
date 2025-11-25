import React, { useState } from 'react';
import AIAnalysisContent from './AIAnalysisContent';
import MessageActions from './MessageActions';
import ScreenshotViewer from './ScreenshotViewer';
import JSONViewer from './JSONViewer';
import CodeBlock from './CodeBlock';
import ToolIcon from './ToolIcon';

export default function ChatMessage({ message, toolThinkingMap = new Map(), toolAnalysisMap = new Map() }) {
    const isUser = message.role === 'user';
    const [expandedTools, setExpandedTools] = useState({});
    const [copiedId, setCopiedId] = useState(null);
    const [expandAllTools, setExpandAllTools] = useState(false);
    const [showErrorDetails, setShowErrorDetails] = useState({});

    const toggleTool = (toolId) => {
        setExpandedTools(prev => ({
            ...prev,
            [toolId]: !prev[toolId]
        }));
    };

    const formatToolName = (toolName) => {
        return toolName
            .replace('mobile_', '')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const formatArguments = (args) => {
        if (typeof args === 'string') {
            try {
                args = JSON.parse(args);
            } catch (e) {
                return args;
            }
        }
        return JSON.stringify(args, null, 2);
    };

    const handleCopy = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return null;
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const messageTimestamp = message.timestamp || message.created_at;

    return (
        <div className={`group w-full ${isUser ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-900'} py-4 sm:py-5 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors duration-200`}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-start space-x-4">
                {/* Avatar - Professional */}
                <div className="shrink-0">
                    {isUser ? (
                        <div className="w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-700 dark:bg-gray-300 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Message Content - Enhanced */}
                <div className="flex-1 min-w-0 space-y-4 relative">
                    {/* Message Actions - Enhanced */}
                    <MessageActions
                        message={message}
                        isUser={isUser}
                        onCopy={() => handleCopy(message.content || '', 'message')}
                    />
                    {/* New Items Section (from OpenAI Agents SDK) */}
                    {!isUser && message.new_items && Array.isArray(message.new_items) && message.new_items.length > 0 && (
                        <div className="mb-4 space-y-2">
                            {/* Visual separator */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center flex-1">
                                    <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                                    <span className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                                        Agent Items ({message.new_items.length})
                                    </span>
                                    <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                {message.new_items.map((item, idx) => {
                                    // MessageOutputItem
                                    if (item.type === 'message_output_item') {
                                        return (
                                            <div key={`item-${idx}`} className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Message Output</div>
                                                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.content || ''}</div>
                                            </div>
                                        );
                                    }
                                    
                                    // ReasoningItem
                                    if (item.type === 'reasoning_item') {
                                        return (
                                            <div key={`item-${idx}`} className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                                <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">💭 Reasoning</div>
                                                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.reasoning || ''}</div>
                                            </div>
                                        );
                                    }
                                    
                                    // HandoffCallItem
                                    if (item.type === 'handoff_call_item') {
                                        return (
                                            <div key={`item-${idx}`} className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">🔄 Handoff Call</div>
                                                <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                                    {item.function?.name || 'Unknown handoff'}
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    // HandoffOutputItem
                                    if (item.type === 'handoff_output_item') {
                                        return (
                                            <div key={`item-${idx}`} className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">🔄 Handoff Output</div>
                                                <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                                    {item.source_agent && item.target_agent 
                                                        ? `${item.source_agent} → ${item.target_agent}`
                                                        : 'Handoff completed'}
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    // ToolCallItem và ToolCallOutputItem được xử lý trong tool_calls section
                                    // Chỉ hiển thị nếu không có trong tool_calls
                                    if (item.type === 'tool_call_item' || item.type === 'tool_call_output_item') {
                                        // These are already handled in tool_calls section for backward compatibility
                                        return null;
                                    }
                                    
                                    // Unknown item type
                                    return (
                                        <div key={`item-${idx}`} className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{item.type || 'Unknown Item'}</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                                                {JSON.stringify(item, null, 2)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    {/* Tool Calls Section (like Cursor) - Backward compatibility */}
                    {!isUser && message.tool_calls && message.tool_calls.length > 0 && (
                        <div className="mb-4 space-y-2">
                            {/* Visual separator with expand/collapse all - Professional */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center flex-1">
                                    <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                                    <span className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                                        Tools ({message.tool_calls.length})
                                    </span>
                                    <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                                </div>
                                {message.tool_calls.length > 1 && (
                                    <button
                                        onClick={() => {
                                            const newState = !expandAllTools;
                                            setExpandAllTools(newState);
                                            const newExpanded = {};
                                            message.tool_calls.forEach(tc => {
                                                const id = tc.id || tc.function?.name || `tool-${message.tool_calls.indexOf(tc)}`;
                                                newExpanded[id] = newState;
                                            });
                                            setExpandedTools(newExpanded);
                                        }}
                                        className="ml-3 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        {expandAllTools ? 'Thu gọn' : 'Mở rộng'}
                                    </button>
                                )}
                            </div>
                            {/* Timeline container - Professional */}
                            <div className="relative">
                                {/* Timeline line */}
                                {message.tool_calls.length > 1 && (
                                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"></div>
                                )}
                                <div className="space-y-2 relative">
                                    {message.tool_calls.map((toolCall, idx) => {
                                        const toolId = toolCall.id || toolCall.function?.name || `tool-${idx}`;
                                        const toolName = toolCall.function?.name || toolCall.name || 'unknown';
                                        const toolArgs = toolCall.function?.arguments || toolCall.arguments || {};
                                        const isExpanded = expandedTools[toolId] ?? expandAllTools;
                                        const status = toolCall.status || (toolCall.result ? 'completed' : toolCall.error ? 'error' : 'running');
                                        const hasResult = !!toolCall.result;
                                        const hasError = !!toolCall.error;

                                        // Unified Mobile Task Agent uses all mobile_* tools directly
                                        // No longer using separate Planner/Executor agents
                                        const isMobileTool = toolName && toolName.startsWith('mobile_');

                                        // Calculate execution duration
                                        const duration = toolCall.duration || toolCall.execution_time;
                                        const formatDuration = (ms) => {
                                            if (!ms) return null;
                                            if (ms < 1000) return `${ms}ms`;
                                            return `${(ms / 1000).toFixed(1)}s`;
                                        };

                                        return (
                                            <div
                                                key={toolId}
                                                className="relative pl-6"
                                            >
                                                {/* Timeline dot */}
                                                {message.tool_calls.length > 1 && (
                                                    <div className={`absolute left-0 top-2.5 w-2 h-2 rounded-full border-2 ${
                                                        status === 'completed' 
                                                            ? 'bg-green-500 border-green-400 dark:border-green-600' 
                                                            : status === 'error' 
                                                            ? 'bg-red-500 border-red-400 dark:border-red-600' 
                                                            : status === 'running' 
                                                            ? 'bg-blue-500 border-blue-400 dark:border-blue-600 animate-pulse' 
                                                            : 'bg-gray-500 border-gray-400 dark:border-gray-600'
                                                    }`}></div>
                                                )}
                                                <div
                                                    className={`border rounded-lg overflow-hidden transition-colors ${
                                                        status === 'completed'
                                                            ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                                                            : status === 'error'
                                                            ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                                                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                                                    }`}
                                                >
                                                    {/* Tool Header */}
                                                    <button
                                                        onClick={() => toggleTool(toolId)}
                                                        className={`w-full px-3 py-2.5 flex items-center gap-2 transition-colors ${
                                                            status === 'completed'
                                                                ? 'hover:bg-green-100/50 dark:hover:bg-green-900/20'
                                                                : status === 'error'
                                                                ? 'hover:bg-red-100/50 dark:hover:bg-red-900/20'
                                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        }`}
                                                    >
                                                        {/* Expand/Collapse Icon */}
                                                        <div className="shrink-0">
                                                            <svg
                                                                className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''} text-gray-500 dark:text-gray-400`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>

                                                        {/* Tool Icon */}
                                                        <div className="shrink-0">
                                                            <ToolIcon toolName={toolName} />
                                                        </div>

                                                        {/* Status Icon - Compact */}
                                                        <div className="shrink-0">
                                                            {status === 'running' && (
                                                                <div className="w-3 h-3 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                                            )}
                                                            {status === 'completed' && (
                                                                <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                            {status === 'error' && (
                                                                <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            )}
                                                            {(!status || status === 'pending') && (
                                                                <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                            )}
                                                        </div>

                                                        {/* Tool Name */}
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                            {isMobileTool && (
                                                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-medium shrink-0">MOBILE</span>
                                                            )}
                                                            <span className={`text-sm font-medium truncate ${
                                                                status === 'completed' ? 'text-green-700 dark:text-green-300' :
                                                                status === 'error' ? 'text-red-700 dark:text-red-300' :
                                                                'text-gray-900 dark:text-gray-200'
                                                            }`}>
                                                                {formatToolName(toolName)}
                                                            </span>
                                                        </div>

                                                        {/* Thinking & Analysis Badges - Inline */}
                                                        {(() => {
                                                            const thinking = toolThinkingMap.get(toolId);
                                                            const analysis = toolAnalysisMap.get(toolId);
                                                            const hasThinking = thinking && (thinking.thinking || thinking.analysis || thinking.reasoning || thinking.next_steps);
                                                            const hasAnalysis = analysis && (analysis.thinking || analysis.analysis || analysis.reasoning || analysis.next_steps);

                                                            const thinkingPreview = hasThinking ? (thinking.thinking || thinking.analysis || thinking.reasoning || '').substring(0, 40) : null;
                                                            const analysisPreview = hasAnalysis ? (analysis.analysis || analysis.thinking || analysis.reasoning || '').substring(0, 40) : null;

                                                            return (
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    {hasThinking && !isExpanded && (
                                                                        <span
                                                                            className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 truncate max-w-[120px]"
                                                                            title={thinkingPreview}
                                                                        >
                                                                            💡 {thinkingPreview}...
                                                                        </span>
                                                                    )}
                                                                    {hasAnalysis && !isExpanded && (
                                                                        <span
                                                                            className="text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800 truncate max-w-[120px]"
                                                                            title={analysisPreview}
                                                                        >
                                                                            🔍 {analysisPreview}...
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Duration & Status Text */}
                                                        <div className="flex items-center gap-2 shrink-0 text-xs text-gray-500 dark:text-gray-400">
                                                            {status === 'running' && (
                                                                <span className="text-blue-600 dark:text-blue-400">Executing...</span>
                                                            )}
                                                            {duration && (
                                                                <span>{formatDuration(duration)}</span>
                                                            )}
                                                        </div>
                                                    </button>

                                        {/* Tool Details - Expandable */}
                                        {isExpanded && (
                                            <div className="px-3 py-3 space-y-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                                {/* Agent Thinking */}
                                                {(() => {
                                                    const thinking = toolThinkingMap.get(toolId);
                                                    if (thinking && (thinking.thinking || thinking.analysis || thinking.reasoning || thinking.next_steps)) {
                                                        // Build content string from structured thinking
                                                        let thinkingContent = '';
                                                        if (thinking.thinking) thinkingContent += `<thinking>${thinking.thinking}</thinking>\n\n`;
                                                        if (thinking.analysis) thinkingContent += `<analysis>${thinking.analysis}</analysis>\n\n`;
                                                        if (thinking.reasoning) thinkingContent += `<reasoning>${thinking.reasoning}</reasoning>\n\n`;
                                                        if (thinking.next_steps) thinkingContent += `<next_steps>${thinking.next_steps}</next_steps>`;

                                                        return (
                                                            <div className="space-y-2">
                                                                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                                                    Thinking
                                                                </div>
                                                                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                                                                    <AIAnalysisContent content={thinkingContent} />
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}

                                                {/* Arguments */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                                            Arguments
                                                        </div>
                                                        <button
                                                            onClick={() => handleCopy(formatArguments(toolArgs), `${toolId}-args`)}
                                                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            title="Copy arguments"
                                                        >
                                                            {copiedId === `${toolId}-args` ? (
                                                                <span className="flex items-center gap-1">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    <span>Copied!</span>
                                                                </span>
                                                            ) : (
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </div>
                                                    {(() => {
                                                        let parsedArgs = toolArgs;
                                                        if (typeof toolArgs === 'string') {
                                                            try {
                                                                parsedArgs = JSON.parse(toolArgs);
                                                            } catch (e) {
                                                                // Not JSON, show as text
                                                                return (
                                                                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700 overflow-x-auto text-gray-900 dark:text-gray-300 font-mono">
                                                                        {toolArgs}
                                                                    </pre>
                                                                );
                                                            }
                                                        }
                                                        // Use JSONViewer for better display
                                                        return <JSONViewer data={parsedArgs} collapsed={true} />;
                                                    })()}
                                                </div>

                                                {/* Result (if available) */}
                                                {toolCall.result && (() => {
                                                    let resultContent = toolCall.result;
                                                    let screenshotData = null;

                                                    // Check if this is a screenshot tool
                                                    const isScreenshotTool = toolName === 'mobile_take_screenshot';

                                                    // Try to extract screenshot data from various formats
                                                    if (isScreenshotTool) {
                                                        // Format 1: JSON string with screenshot field
                                                        if (typeof resultContent === 'string') {
                                                            try {
                                                                const parsed = JSON.parse(resultContent);
                                                                if (parsed.screenshot) {
                                                                    screenshotData = parsed.screenshot;
                                                                    resultContent = parsed.message || 'Screenshot captured successfully';
                                                                } else if (parsed.image) {
                                                                    screenshotData = parsed.image;
                                                                    resultContent = parsed.message || 'Screenshot captured successfully';
                                                                } else {
                                                                    resultContent = parsed;
                                                                }
                                                            } catch (e) {
                                                                // Not JSON, check if it's base64 string directly
                                                                if (resultContent.match(/^[A-Za-z0-9+/=]+$/)) {
                                                                    screenshotData = resultContent;
                                                                    resultContent = 'Screenshot captured successfully';
                                                                }
                                                            }
                                                        }
                                                        // Format 2: Object with screenshot/image field
                                                        else if (typeof resultContent === 'object' && resultContent !== null) {
                                                            // Format 0: Array-like object với numeric keys: { '0': {...} }
                                                            if (resultContent['0'] || resultContent[0]) {
                                                                const firstItem = resultContent['0'] || resultContent[0];
                                                                if (typeof firstItem === 'object' && firstItem !== null) {
                                                                    if (firstItem.type === 'image' && firstItem.data) {
                                                                        screenshotData = firstItem.data;
                                                                        resultContent = 'Screenshot captured successfully';
                                                                    } else if (firstItem.screenshot) {
                                                                        screenshotData = firstItem.screenshot;
                                                                        resultContent = 'Screenshot captured successfully';
                                                                    } else if (firstItem.image) {
                                                                        screenshotData = firstItem.image;
                                                                        resultContent = 'Screenshot captured successfully';
                                                                    } else if (firstItem.data) {
                                                                        screenshotData = firstItem.data;
                                                                        resultContent = 'Screenshot captured successfully';
                                                                    }
                                                                } else if (typeof firstItem === 'string' && firstItem.length > 100) {
                                                                    screenshotData = firstItem;
                                                                    resultContent = 'Screenshot captured successfully';
                                                                }
                                                            }
                                                            // Check for InputImage format: { type: "input_image", image: "base64..." }
                                                            else if (resultContent.type === 'input_image' && resultContent.image) {
                                                                screenshotData = resultContent.image;
                                                                resultContent = 'Screenshot captured successfully';
                                                            }
                                                            // Check for screenshot field (new format with file_id support)
                                                            else if (resultContent.screenshot) {
                                                                screenshotData = resultContent.screenshot;
                                                                resultContent = resultContent.message || 'Screenshot captured successfully';
                                                            }
                                                            // Check for file_id format (from OpenAI Files API)
                                                            else if (resultContent.file_id && resultContent.format === 'file_id') {
                                                                // Screenshot should be in screenshot field, but if not, try to get from onScreenshot event
                                                                // For now, show message that screenshot was captured
                                                                if (resultContent.screenshot) {
                                                                    screenshotData = resultContent.screenshot;
                                                                } else {
                                                                    // Screenshot will come from onScreenshot WebSocket event
                                                                    resultContent = resultContent.message || `Screenshot captured (file_id: ${resultContent.file_id})`;
                                                                }
                                                            }
                                                            // Check for image field
                                                            else if (resultContent.image) {
                                                                screenshotData = resultContent.image;
                                                                resultContent = resultContent.message || 'Screenshot captured successfully';
                                                            }
                                                            // Check for content array format: { content: [{ type: "image", data: "base64..." }] }
                                                            else if (resultContent.content && Array.isArray(resultContent.content)) {
                                                                const imageItem = resultContent.content.find(item => item && item.type === 'image' && item.data);
                                                                if (imageItem && imageItem.data) {
                                                                    screenshotData = imageItem.data;
                                                                    resultContent = 'Screenshot captured successfully';
                                                                }
                                                            }
                                                            // Check for array format: [{ type: "image", data: "base64..." }]
                                                            else if (Array.isArray(resultContent) && resultContent.length > 0) {
                                                                const imageItem = resultContent.find(item => item && item.type === 'image' && item.data);
                                                                if (imageItem && imageItem.data) {
                                                                    screenshotData = imageItem.data;
                                                                    resultContent = 'Screenshot captured successfully';
                                                                }
                                                            }
                                                        }
                                                    }

                                                    const resultText = typeof resultContent === 'string'
                                                        ? resultContent
                                                        : JSON.stringify(resultContent, null, 2);

                                                    // Convert base64 to data URL nếu cần
                                                    let screenshotImageUrl = screenshotData;
                                                    if (screenshotData && typeof screenshotData === 'string') {
                                                        if (!screenshotData.startsWith('data:')) {
                                                            // Nếu là base64 string thuần, thêm data URL prefix
                                                            if (screenshotData.startsWith('/9j/') || screenshotData.startsWith('iVBORw0KGgo')) {
                                                                // JPEG hoặc PNG base64
                                                                const mimeType = screenshotData.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
                                                                screenshotImageUrl = `data:${mimeType};base64,${screenshotData}`;
                                                            } else if (!screenshotData.includes('base64,')) {
                                                                screenshotImageUrl = `data:image/jpeg;base64,${screenshotData}`;
                                                            }
                                                        }
                                                    }

                                                    return (
                                                        <div className="space-y-4">
                                                            {/* Screenshot Image Display */}
                                                            {screenshotImageUrl && (
                                                                <div className="space-y-2">
                                                                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                                        Screenshot
                                                                    </div>
                                                                    <ScreenshotViewer
                                                                        imageUrl={screenshotImageUrl}
                                                                        alt="Screenshot"
                                                                        metadata={{
                                                                            deviceId: toolCall.deviceId,
                                                                            timestamp: toolCall.timestamp || Date.now()
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}

                                                            {/* Result */}
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                                                        Result
                                                                    </div>
                                                                    {!screenshotData && (
                                                                        <button
                                                                            onClick={() => handleCopy(resultText, `${toolId}-result`)}
                                                                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                            title="Copy result"
                                                                        >
                                                                            {copiedId === `${toolId}-result` ? (
                                                                                <span className="flex items-center gap-1">
                                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                    </svg>
                                                                                    <span>Copied!</span>
                                                                                </span>
                                                                            ) : (
                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                                </svg>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {!screenshotData && (() => {
                                                                    // Try to detect if result is JSON
                                                                    try {
                                                                        const parsed = typeof resultContent === 'string' ? JSON.parse(resultContent) : resultContent;
                                                                        if (typeof parsed === 'object' && parsed !== null) {
                                                                            return <JSONViewer data={parsed} collapsed={false} />;
                                                                        }
                                                                    } catch (e) {
                                                                        // Not JSON, show as text
                                                                    }
                                                                    // Check if it's code-like
                                                                    if (resultText.length > 100 && (resultText.includes('\n') || resultText.includes('{') || resultText.includes('['))) {
                                                                        return (
                                                                            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700 overflow-x-auto text-gray-900 dark:text-gray-300 font-mono max-h-64 overflow-y-auto">
                                                                                {resultText}
                                                                            </pre>
                                                                        );
                                                                    }
                                                                    // Regular text
                                                                    return (
                                                                        <div className="text-sm text-gray-900 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700 whitespace-pre-wrap break-words">
                                                                            {resultText}
                                                                        </div>
                                                                    );
                                                                })()}
                                                                {screenshotData && !screenshotImageUrl && (
                                                                    <div className="text-xs text-gray-400 p-3">
                                                                        {resultText}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Agent Analysis */}
                                                            {(() => {
                                                                const analysis = toolAnalysisMap.get(toolId);
                                                                if (analysis && (analysis.thinking || analysis.analysis || analysis.reasoning || analysis.next_steps)) {
                                                                    // Build content string from structured analysis
                                                                    let analysisContent = '';
                                                                    if (analysis.thinking) analysisContent += `<thinking>${analysis.thinking}</thinking>\n\n`;
                                                                    if (analysis.analysis) analysisContent += `<analysis>${analysis.analysis}</analysis>\n\n`;
                                                                    if (analysis.reasoning) analysisContent += `<reasoning>${analysis.reasoning}</reasoning>\n\n`;
                                                                    if (analysis.next_steps) analysisContent += `<next_steps>${analysis.next_steps}</next_steps>`;

                                                                    return (
                                                                        <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                                                                Analysis
                                                                            </div>
                                                                            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                                                                                <AIAnalysisContent content={analysisContent} />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                    );
                                                })()}

                                                {/* Error (if available) */}
                                                {toolCall.error && (() => {
                                                    // Convert error to string - handle both string and object errors
                                                    let errorText = '';
                                                    let errorDetails = null;
                                                    if (typeof toolCall.error === 'string') {
                                                        errorText = toolCall.error;
                                                    } else if (typeof toolCall.error === 'object' && toolCall.error !== null) {
                                                        // If error is an object, extract error message
                                                        if (toolCall.error.error) {
                                                            errorText = typeof toolCall.error.error === 'string'
                                                                ? toolCall.error.error
                                                                : JSON.stringify(toolCall.error.error);
                                                        } else if (toolCall.error.message) {
                                                            errorText = toolCall.error.message;
                                                        } else {
                                                            errorText = JSON.stringify(toolCall.error);
                                                        }
                                                        // Store full error object for details
                                                        errorDetails = toolCall.error;
                                                    } else {
                                                        errorText = String(toolCall.error);
                                                    }

                                                    const errorDetailsKey = `${toolId}-error-details`;
                                                    const isErrorDetailsShown = showErrorDetails[errorDetailsKey] || false;

                                                    return (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                                                                    Error
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {errorDetails && (
                                                                        <button
                                                                            onClick={() => setShowErrorDetails(prev => ({
                                                                                ...prev,
                                                                                [errorDetailsKey]: !prev[errorDetailsKey]
                                                                            }))}
                                                                            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                                                                            title="Show error details"
                                                                        >
                                                                            {isErrorDetailsShown ? 'Ẩn' : 'Chi tiết'}
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleCopy(errorText, `${toolId}-error`)}
                                                                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                                                                        title="Copy error"
                                                                    >
                                                                        {copiedId === `${toolId}-error` ? (
                                                                            <span className="flex items-center gap-1">
                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                                <span>Copied!</span>
                                                                            </span>
                                                                        ) : (
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                            </svg>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="text-sm bg-red-50 dark:bg-red-900/10 p-3 rounded-md border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                                                                <div className="font-medium mb-1">{errorText}</div>
                                                                {isErrorDetailsShown && errorDetails && (
                                                                    <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                                                                        <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words font-mono">
                                                                            {JSON.stringify(errorDetails, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                    );
                                })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Visual separator between tool calls and text content */}
                    {!isUser && message.tool_calls && message.tool_calls.length > 0 && message.content && (
                        <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
                    )}

                    {/* Message Content - Professional */}
                    {message.content && (
                        <div className={`${message.tool_calls && message.tool_calls.length > 0 ? 'mt-3' : ''} ${
                            isUser 
                                ? 'bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700' 
                                : 'prose prose-sm dark:prose-invert max-w-none'
                        }`}>
                            <AIAnalysisContent content={message.content} />
                        </div>
                    )}

                    {/* Metadata Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <div className="flex items-center space-x-3">
                            {messageTimestamp && (
                                <span className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors" title={new Date(messageTimestamp).toLocaleString()}>
                                    {formatTimestamp(messageTimestamp)}
                                </span>
                            )}
                            {!isUser && message.iterations > 0 && (
                                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                                    {message.iterations} tool{message.iterations > 1 ? 's' : ''}
                                </span>
                            )}
                            {!isUser && message.model && (
                                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                                    {message.model}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Script info */}
                    {!isUser && message.script && (
                        <div className="mt-3 flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                                Script: {message.script.name} ({message.script.total_steps} bước)
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

