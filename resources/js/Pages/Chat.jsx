import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import ChatMessage from '../Components/Chat/ChatMessage';
import ChatInput from '../Components/Chat/ChatInput';
import TypingIndicator from '../Components/Chat/TypingIndicator';
import MessageSkeleton from '../Components/Chat/MessageSkeleton';
import ChatSidebar from '../Components/Chat/ChatSidebar';
import TaskList from '../Components/Chat/TaskList';
import FlowViewer from '../Components/Chat/FlowViewer';
import PlanDialog from '../Components/Chat/PlanDialog';
import DraggablePhoneViewer from '../Components/DraggablePhoneViewer';
import DeviceSelector from '../Components/DeviceSelector';
import ConfirmDialog from '../Components/Admin/ConfirmDialog';
import useConfirmDialog from '../Hooks/useConfirmDialog';
import { useLocalApp } from '../Hooks/useLocalApp';
import { useTheme } from '../Contexts/ThemeContext';
import { toast } from '../Utils/toast';
import axios from 'axios';
import route from '../Utils/route';

// Helper functions to process new_items from OpenAI Agents SDK
// According to SDK: new_items contains RunItem objects (MessageOutputItem, ToolCallItem, ToolCallOutputItem, etc.)

/**
 * Extract tool_calls from new_items for backward compatibility
 * Tool calls are derived from ToolCallItem and ToolCallOutputItem in new_items
 */
const extractToolCallsFromNewItems = (newItems) => {
    if (!Array.isArray(newItems)) return [];

    const toolCallsMap = new Map();

    // Process ToolCallItem and ToolCallOutputItem
    newItems.forEach(item => {
        if (item.type === 'tool_call_item') {
            const toolId = item.id || item.function?.name;
            if (toolId) {
                toolCallsMap.set(toolId, {
                    id: item.id,
                    function: item.function,
                    status: 'running',
                    result: null,
                    error: null
                });
            }
        } else if (item.type === 'tool_call_output_item') {
            // Find corresponding tool call by ID from raw_item
            const toolId = item.raw_item?.id || item.raw_item?.function?.name;
            if (toolId && toolCallsMap.has(toolId)) {
                const existing = toolCallsMap.get(toolId);
                toolCallsMap.set(toolId, {
                    ...existing,
                    result: item.output,
                    status: 'completed',
                    error: null
                });
            }
        }
    });

    return Array.from(toolCallsMap.values());
};

/**
 * Merge new_items into existing message, avoiding duplicates
 * Uses item.id or generates unique ID from type + raw_item
 */
const mergeNewItems = (existingItems, newItems) => {
    if (!Array.isArray(newItems) || newItems.length === 0) {
        return existingItems || [];
    }

    const existing = existingItems || [];
    const existingIds = new Set(
        existing.map(item => item.id || `${item.type}_${JSON.stringify(item.raw_item || item)}`)
    );

    const merged = [...existing];
    newItems.forEach(item => {
        const itemId = item.id || `${item.type}_${JSON.stringify(item.raw_item || item)}`;
        if (!existingIds.has(itemId)) {
            merged.push(item);
            existingIds.add(itemId);
        }
    });

    return merged;
};

/**
 * Get unique ID for a new_item
 */
const getItemId = (item) => {
    return item.id || `${item.type}_${JSON.stringify(item.raw_item || item)}`;
};

export default function Chat({ messages: initialMessages, sessions: initialSessions = [], activeSession: initialActiveSession = null, auth }) {
    const { props } = usePage();
    const user = auth?.user || props?.auth?.user;
    const { theme, toggleTheme } = useTheme();

    // Preserve session_id in URL on mount and when session changes
    useEffect(() => {
        // Get session_id from URL query or initialActiveSession or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const urlSessionId = urlParams.get('session_id');
        const localStorageSessionId = localStorage.getItem('ai_active_session_id');
        const sessionIdToUse = urlSessionId || initialActiveSession?.session_id || localStorageSessionId;

        console.log('[Chat] Mount - Session ID resolution:', {
            urlSessionId,
            initialActiveSession_session_id: initialActiveSession?.session_id,
            localStorageSessionId,
            sessionIdToUse,
            initialMessages_count: initialMessages?.length || 0,
            sessions_count: initialSessions?.length || 0,
        });

        // If we have a session_id but it's not in URL, update URL
        if (sessionIdToUse && !urlSessionId) {
            console.log('[Chat] Updating URL with session_id:', sessionIdToUse);
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('session_id', sessionIdToUse);
            window.history.replaceState({}, '', newUrl);
        }
    }, []);

    // Load messages từ Laravel - extract tool_calls from new_items if available
    const [messages, setMessages] = useState(() => {
        if (initialMessages && Array.isArray(initialMessages)) {
            return initialMessages.map(msg => {
                // Extract tool_calls from new_items (new format) or use tool_calls directly (backward compatibility)
                const toolCalls = msg.new_items && Array.isArray(msg.new_items) && msg.new_items.length > 0
                    ? extractToolCallsFromNewItems(msg.new_items)
                    : (msg.tool_calls || null);

                return {
                    id: msg.id || Date.now() + Math.random(),
                    content: msg.content || '',
                    role: msg.role || 'user',
                    new_items: msg.new_items || [],
                    tool_calls: toolCalls,
                    iterations: msg.iterations || 0,
                    device_id: msg.device_id || null,
                    metadata: msg.metadata || {},
                    created_at: msg.created_at || new Date().toISOString(),
                };
            });
        }
        return [];
    });

    // Track saved message IDs để update thay vì create mới
    const savedMessageIds = useRef((() => {
        const map = new Map();
        // Khởi tạo từ initialMessages (đã có ID từ database)
        if (initialMessages && Array.isArray(initialMessages)) {
            initialMessages.forEach(msg => {
                if (msg.id && typeof msg.id === 'number') {
                    map.set(msg.id, msg.id); // Use same ID for both
                }
            });
        }
        return map;
    })());
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentDeviceId, setCurrentDeviceId] = useState(() => {
        // Load device ID from localStorage on mount
        try {
            const saved = localStorage.getItem('selected_device_id');
            return saved || null;
        } catch (error) {
            console.error('[Chat] Error loading device ID from localStorage:', error);
            return null;
        }
    });
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showDeviceSelector, setShowDeviceSelector] = useState(false);
    const [showFlowViewer, setShowFlowViewer] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState('openai');
    // Model cố định là gpt-5-mini, không cho phép thay đổi
    const selectedModel = 'gpt-5-mini';
    // Max turns configuration - load from localStorage or use default
    // Use 9999 for unlimited turns (SDK doesn't support None, so use very large number)
    const [maxTurns, setMaxTurns] = useState(() => {
        try {
            const saved = localStorage.getItem('ai_max_turns');
            return saved ? parseInt(saved, 10) : 9999; // Default to unlimited
        } catch (error) {
            console.error('[Chat] Error loading max_turns from localStorage:', error);
            return 9999; // Default to unlimited
        }
    });
    const [sessions, setSessions] = useState(initialSessions);
    const [selectedSession, setSelectedSession] = useState(initialActiveSession);
    const [sessionId, setSessionId] = useState(initialActiveSession?.session_id || '');
    const [showSessionManager, setShowSessionManager] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [sessionActionLoading, setSessionActionLoading] = useState(false);
    const [sessionListLoading, setSessionListLoading] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');
    const { confirmDialog, hideDialog, dialogProps } = useConfirmDialog();

    // API Keys - lưu trong localStorage
    const [apiKeys, setApiKeys] = useState(() => {
        try {
            const saved = localStorage.getItem('ai_api_keys');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Ensure all keys exist and trim them
                return {
                    openai: (parsed.openai || '').trim(),
                    gemini: (parsed.gemini || '').trim(),
                    claude: (parsed.claude || '').trim()
                };
            }
        } catch (error) {
            console.error('[Chat] Error loading API keys from localStorage:', error);
        }
        return {
            openai: '',
            gemini: '',
            claude: ''
        };
    });
    const [showApiKeySettings, setShowApiKeySettings] = useState(false);
    const [activeTools, setActiveTools] = useState([]); // Track active tool executions
    const [currentAssistantMessageId, setCurrentAssistantMessageId] = useState(null); // Track current streaming message
    const [currentStatus, setCurrentStatus] = useState(null); // Track current status update
    const [thinkingMessage, setThinkingMessage] = useState(null); // Track current thinking content
    // Initialize tool thinking/analysis maps from initialMessages metadata
    const initializeToolMaps = (msgs) => {
        const thinkingMap = new Map();
        const analysisMap = new Map();

        msgs.forEach(msg => {
            if (msg.metadata && msg.metadata.tool_thinking) {
                Object.entries(msg.metadata.tool_thinking).forEach(([toolCallId, thinking]) => {
                    thinkingMap.set(toolCallId, thinking);
                });
            }
            if (msg.metadata && msg.metadata.tool_analysis) {
                Object.entries(msg.metadata.tool_analysis).forEach(([toolCallId, analysis]) => {
                    analysisMap.set(toolCallId, analysis);
                });
            }
        });

        return { thinkingMap, analysisMap };
    };

    const [toolThinkingMap, setToolThinkingMap] = useState(() => {
        if (initialMessages && Array.isArray(initialMessages)) {
            return initializeToolMaps(initialMessages).thinkingMap;
        }
        return new Map();
    }); // Map tool call ID to structured thinking
    const [toolAnalysisMap, setToolAnalysisMap] = useState(() => {
        if (initialMessages && Array.isArray(initialMessages)) {
            return initializeToolMaps(initialMessages).analysisMap;
        }
        return new Map();
    }); // Map tool call ID to agent's analysis
    const messagesEndRef = useRef(null);
    const timeoutRefs = useRef(new Set()); // Track all timeouts để cleanup
    const sessionIdRef = useRef(sessionId);
    const dbUpdateTimeoutRef = useRef(null); // Debounce database updates
    const lastContentRef = useRef(''); // Track last content để append delta
    const abortControllerRef = useRef(null); // AbortController để stop request

    // Task list state
    const [taskList, setTaskList] = useState([]);
    const [currentTaskStep, setCurrentTaskStep] = useState(0);
    const [isTaskComplete, setIsTaskComplete] = useState(false);
    const [showTaskList, setShowTaskList] = useState(true);
    // Plan Dialog state
    const [currentPlan, setCurrentPlan] = useState(null);
    const [nextAction, setNextAction] = useState(null);
    const [planSummary, setPlanSummary] = useState(null);
    const [showPlanDialog, setShowPlanDialog] = useState(false);
    // Workflow state - auto-generated from tool calls
    const [currentWorkflow, setCurrentWorkflow] = useState(null);
    const [savedWorkflowId, setSavedWorkflowId] = useState(null);

    // Drag state for TaskList dialog
    const [taskListPosition, setTaskListPosition] = useState({ x: null, y: null });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const taskListDialogRef = useRef(null);

    const updateSessionsState = useCallback((session) => {
        if (!session) return;
        setSessions(prev => {
            const filtered = prev.filter(item => item.id !== session.id);
            return [session, ...filtered];
        });
    }, []);

    const refreshSessions = useCallback(async () => {
        try {
            setSessionListLoading(true);
            const response = await axios.get('/api/chat/sessions');
            const fetched = response.data.sessions || [];
            setSessions(fetched);
            if (sessionIdRef.current) {
                const match = fetched.find(s => s.session_id === sessionIdRef.current);
                if (match) {
                    setSelectedSession(match);
                }
            } else if (fetched.length > 0) {
                const session = fetched[0];
                setSelectedSession(session);
                setSessionId(session.session_id);
            }
        } catch (error) {
            console.error('[Chat] Failed to load sessions:', error);
        } finally {
            setSessionListLoading(false);
        }
    }, []);

    const ensureSessionReady = useCallback(async () => {
        if (sessionIdRef.current) {
            return sessionIdRef.current;
        }

        try {
            setSessionActionLoading(true);
            const response = await axios.post('/api/chat/sessions', {
                device_id: currentDeviceId,
                provider: selectedProvider,
                model: selectedModel,
            });
            const session = response.data.session;
            updateSessionsState(session);
            setSelectedSession(session);
            setSessionId(session.session_id);
            return session.session_id;
        } catch (error) {
            console.error('[Chat] Failed to auto-create session:', error);
            throw error;
        } finally {
            setSessionActionLoading(false);
        }
    }, [currentDeviceId, selectedProvider, selectedModel, updateSessionsState]);

    // Initialize WebSocket connection via useLocalApp hook
    // This ensures WebSocket is connected to receive real-time tool execution events
    const { wsConnected } = useLocalApp();

    // Log WebSocket connection status
    useEffect(() => {
        if (wsConnected) {
            console.log('[Chat] WebSocket connected - ready for real-time updates');
        } else {
            console.warn('[Chat] WebSocket not connected - real-time updates may not work');
        }
    }, [wsConnected]);

    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);

    useEffect(() => {
        try {
            if (sessionId) {
                localStorage.setItem('ai_active_session_id', sessionId);

                // Update URL with session_id to preserve on refresh
                const urlParams = new URLSearchParams(window.location.search);
                const currentUrlSessionId = urlParams.get('session_id');
                console.log('[Chat] Session ID changed:', {
                    newSessionId: sessionId,
                    currentUrlSessionId,
                    willUpdateUrl: currentUrlSessionId !== sessionId,
                });

                if (currentUrlSessionId !== sessionId) {
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('session_id', sessionId);
                    window.history.replaceState({}, '', newUrl);
                    console.log('[Chat] URL updated with session_id:', newUrl.toString());
                }
            } else {
                localStorage.removeItem('ai_active_session_id');
                console.log('[Chat] Session ID cleared');
            }

            // Update WebSocket session registration when session changes
            // Get WebSocket from useLocalApp hook if available
            const updateWebSocketSession = () => {
                try {
                    // Try to get WebSocket instance from window or event
                    // We'll use a custom event to trigger session update
                    window.dispatchEvent(new CustomEvent('websocket:update:session', {
                        detail: {
                            session_id: sessionId,
                            device_id: currentDeviceId
                        }
                    }));
                } catch (error) {
                    console.warn('[Chat] Error updating WebSocket session:', error);
                }
            };

            updateWebSocketSession();
        } catch (error) {
            console.warn('[Chat] Unable to persist session ID:', error);
        }
    }, [sessionId, currentDeviceId]);

    // Listen for WebSocket session registration confirmation
    useEffect(() => {
        const handleSessionRegistered = (event) => {
            const { session_id, device_id, connected_at } = event.detail;
            console.log('[Chat] WebSocket session confirmed:', { session_id, device_id, connected_at });
            // You can update UI state here if needed
        };

        window.addEventListener('websocket:session:registered', handleSessionRegistered);

        return () => {
            window.removeEventListener('websocket:session:registered', handleSessionRegistered);
        };
    }, []);

    useEffect(() => {
        if (!sessionId) return;
        const match = sessions.find(session => session.session_id === sessionId);
        if (match) {
            setSelectedSession(match);
        }
    }, [sessionId, sessions]);

    // Reload messages when session changes (including on F5)
    // Use a ref to track if we've already loaded for this session
    const loadedSessionRef = useRef(null);

    useEffect(() => {
        const loadSessionMessages = async () => {
            console.log('[Chat] loadSessionMessages called:', {
                sessionId,
                loadedSessionRef: loadedSessionRef.current,
                initialActiveSession_session_id: initialActiveSession?.session_id,
                initialMessages_count: initialMessages?.length || 0,
                sessions_count: sessions?.length || 0,
            });

            // Skip if no session ID
            if (!sessionId) {
                console.log('[Chat] No sessionId, skipping load');
                return;
            }

            // Skip if we already loaded messages for this session
            if (loadedSessionRef.current === sessionId) {
                console.log('[Chat] Already loaded messages for this session, skipping');
                return;
            }

            // Skip if this is initial load and we have initialMessages
            if (sessionId === initialActiveSession?.session_id && initialMessages && initialMessages.length > 0) {
                console.log('[Chat] Using initialMessages, skipping load', {
                    initialMessages_count: initialMessages.length,
                });
                loadedSessionRef.current = sessionId;
                return;
            }

            try {
                // Find session by session_id
                const session = sessions.find(s => s.session_id === sessionId);
                console.log('[Chat] Session lookup:', {
                    sessionId,
                    session_found: !!session,
                    session_id: session?.id,
                    all_session_ids: sessions.map(s => s.session_id),
                });

                if (!session) {
                    console.warn('[Chat] Session not found in sessions list');
                    return;
                }

                // Load messages for this session
                console.log('[Chat] Loading messages from API:', `/api/chat/sessions/${session.id}`);
                const response = await axios.get(`/api/chat/sessions/${session.id}`);
                const sessionMessages = response.data.messages || [];

                console.log('[Chat] Messages loaded from API:', {
                    session_id: session.id,
                    messages_count: sessionMessages.length,
                    message_ids: sessionMessages.map(m => m.id),
                    first_message: sessionMessages[0],
                    last_message: sessionMessages[sessionMessages.length - 1],
                });

                // Format messages - extract tool_calls from new_items if available
                const formattedMessages = sessionMessages.map(msg => {
                    // Extract tool_calls from new_items (new format) or use tool_calls directly (backward compatibility)
                    const toolCalls = msg.new_items && Array.isArray(msg.new_items) && msg.new_items.length > 0
                        ? extractToolCallsFromNewItems(msg.new_items)
                        : (msg.tool_calls || null);

                    return {
                        id: msg.id || Date.now() + Math.random(),
                        content: msg.content || '',
                        role: msg.role || 'user',
                        new_items: msg.new_items || [],
                        tool_calls: toolCalls,
                        iterations: msg.iterations || 0,
                        device_id: msg.device_id || null,
                        metadata: msg.metadata || {},
                        created_at: msg.created_at || new Date().toISOString(),
                    };
                });

                console.log('[Chat] Setting messages:', {
                    count: formattedMessages.length,
                    first_message: formattedMessages[0],
                    last_message: formattedMessages[formattedMessages.length - 1],
                });

                setMessages(formattedMessages);

                // Restore tool thinking/analysis from metadata
                const { thinkingMap, analysisMap } = initializeToolMaps(formattedMessages);
                setToolThinkingMap(thinkingMap);
                setToolAnalysisMap(analysisMap);

                // Update savedMessageIds
                formattedMessages.forEach(msg => {
                    if (msg.id && typeof msg.id === 'number') {
                        savedMessageIds.current.set(msg.id, msg.id);
                    }
                });

                // Mark as loaded
                loadedSessionRef.current = sessionId;
                console.log('[Chat] Messages loaded successfully');
            } catch (error) {
                console.error('[Chat] Failed to load session messages on session change:', error);
            }
        };

        // Only reload if session_id is set
        if (sessionId) {
            loadSessionMessages();
        }
    }, [sessionId, sessions]); // Depend on both sessionId and sessions

    useEffect(() => {
        if (showSessionManager) {
            refreshSessions();
        }
    }, [showSessionManager, refreshSessions]);

    // Check device ID on mount and show selector if missing
    useEffect(() => {
        if (!currentDeviceId) {
            setShowDeviceSelector(true);
        }
    }, []); // Only run on mount

    // Save device ID to localStorage when it changes
    useEffect(() => {
        if (currentDeviceId) {
            try {
                localStorage.setItem('selected_device_id', currentDeviceId);
            } catch (error) {
                console.error('[Chat] Error saving device ID to localStorage:', error);
            }
        }
    }, [currentDeviceId]);

    const handleSelectDevice = (deviceId) => {
        setCurrentDeviceId(deviceId);
        setShowDeviceSelector(false);
    };


    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Listen for tool execution events from WebSocket
    // Note: Tool calls are now primarily managed via new_items from SDK
    // These handlers are kept for active tools indicator and backward compatibility
    useEffect(() => {
        const handleToolStarted = (e) => {
            const { tool, toolCall } = e.detail;

            // Update active tools indicator
            const toolId = toolCall?.id || toolCall?.function?.name || tool;
            setActiveTools(prev => {
                const existingIndex = prev.findIndex(t => {
                    const tId = t.toolCall?.id || t.toolCall?.function?.name || t.tool;
                    return tId === toolId;
                });

                if (existingIndex !== -1) {
                    const updated = [...prev];
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        status: 'running',
                        startTime: Date.now()
                    };
                    return updated;
                }

                return [...prev, {
                    tool,
                    toolCall,
                    status: 'running',
                    startTime: Date.now()
                }];
            });

            // Tool calls are now managed via new_items in handleResponseUpdate
            // No need to manually update tool_calls here
        };

        const handleToolCompleted = (e) => {
            const { tool, success, result, toolCall } = e.detail;

            // Update active tools indicator
            const toolId = toolCall?.id || toolCall?.function?.name || tool;
            setActiveTools(prev => prev.map(t => {
                const tId = t.toolCall?.id || t.toolCall?.function?.name || t.tool;
                if (tId === toolId) {
                    return { ...t, status: success ? 'completed' : 'error', result };
                }
                return t;
            }));

            // Tool calls are now managed via new_items in handleResponseUpdate
            // ToolCallOutputItem will be added to new_items by SDK, which will update tool_calls automatically

            // Remove completed tool from active tools after 2 seconds
            const timeoutId = setTimeout(() => {
                const toolIdToRemove = toolCall?.id || toolCall?.function?.name || tool;
                setActiveTools(prev => prev.filter(t => {
                    const tId = t.toolCall?.id || t.toolCall?.function?.name || t.tool;
                    return tId !== toolIdToRemove && t.tool !== tool;
                }));
                timeoutRefs.current.delete(timeoutId);
            }, 2000);
            timeoutRefs.current.add(timeoutId);
        };

        const handleScreenshot = (e) => {
            const { deviceId, screenshot, file_id, format, timestamp } = e.detail || {};

            if (!deviceId || (!screenshot && !file_id)) {
                console.warn('[Chat] handleScreenshot: Missing deviceId or screenshot data');
                return;
            }

            // Screenshot updates are now handled via ToolCallOutputItem in new_items
            // This handler is kept for backward compatibility and active tools indicator
            // The actual screenshot data will be in new_items from SDK
        };

        const handleChatCompleted = () => {
            // Save final message to database when chat is completed
            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === 'assistant' && currentAssistantMessageId) {
                    const dbId = savedMessageIds.current.get(currentAssistantMessageId);

                    // Collect tool thinking/analysis for this message's tool calls
                    // Tool calls are now extracted from new_items, so we can get IDs from there
                    const toolThinking = {};
                    const toolAnalysis = {};

                    // Get tool call IDs from new_items (ToolCallItem)
                    if (lastMsg.new_items && Array.isArray(lastMsg.new_items)) {
                        lastMsg.new_items.forEach(item => {
                            if (item.type === 'tool_call_item' && item.id) {
                                const toolCallId = item.id;
                                const thinking = toolThinkingMap.get(toolCallId);
                                const analysis = toolAnalysisMap.get(toolCallId);
                                if (thinking) {
                                    toolThinking[toolCallId] = thinking;
                                }
                                if (analysis) {
                                    toolAnalysis[toolCallId] = analysis;
                                }
                            }
                        });
                    }

                    // Fallback: also check tool_calls extracted from new_items for backward compatibility
                    // Ensure tool_calls are extracted from new_items first
                    const toolCallsForMetadata = lastMsg.new_items && Array.isArray(lastMsg.new_items) && lastMsg.new_items.length > 0
                        ? extractToolCallsFromNewItems(lastMsg.new_items)
                        : (lastMsg.tool_calls || []);

                    if (toolCallsForMetadata && Array.isArray(toolCallsForMetadata)) {
                        toolCallsForMetadata.forEach(tc => {
                            const toolCallId = tc.id || tc.function?.name || tc.name;
                            if (toolCallId && !toolThinking[toolCallId] && !toolAnalysis[toolCallId]) {
                                const thinking = toolThinkingMap.get(toolCallId);
                                const analysis = toolAnalysisMap.get(toolCallId);
                                if (thinking) {
                                    toolThinking[toolCallId] = thinking;
                                }
                                if (analysis) {
                                    toolAnalysis[toolCallId] = analysis;
                                }
                            }
                        });
                    }

                    const metadata = {};
                    if (Object.keys(toolThinking).length > 0) {
                        metadata.tool_thinking = toolThinking;
                    }
                    if (Object.keys(toolAnalysis).length > 0) {
                        metadata.tool_analysis = toolAnalysis;
                    }

                    // Extract tool_calls from new_items before saving (ensure consistency)
                    const finalToolCalls = lastMsg.new_items && Array.isArray(lastMsg.new_items) && lastMsg.new_items.length > 0
                        ? extractToolCallsFromNewItems(lastMsg.new_items)
                        : (lastMsg.tool_calls || null);

                    if (dbId) {
                        // Update existing message in DB with final content
                        axios.put('/api/chat/update', {
                            message_id: dbId,
                            content: lastMsg.content || '',
                            tool_calls: finalToolCalls,
                            new_items: lastMsg.new_items || null, // Save new_items (primary source)
                            iterations: lastMsg.iterations || 0,
                            metadata: Object.keys(metadata).length > 0 ? metadata : null,
                            session_id: sessionIdRef.current,
                        }).catch(err => {
                            console.warn('Failed to update final message in database:', err);
                        });
                    } else {
                        // If no DB ID yet, save as new message
                        axios.post('/api/chat/save', {
                            assistant_message: {
                                content: lastMsg.content || '',
                                tool_calls: finalToolCalls,
                                new_items: lastMsg.new_items || null, // Save new_items (primary source)
                                iterations: lastMsg.iterations || 0,
                                metadata: Object.keys(metadata).length > 0 ? metadata : null,
                            },
                            device_id: currentDeviceId,
                            session_id: sessionIdRef.current,
                            provider: selectedProvider,
                            model: selectedModel,
                        }).then(saveResponse => {
                            if (saveResponse.data.success && saveResponse.data.assistant_message?.id) {
                                savedMessageIds.current.set(currentAssistantMessageId, saveResponse.data.assistant_message.id);
                            }
                        }).catch(err => {
                            console.warn('Failed to save final message to database:', err);
                        });
                    }
                }
                return prev;
            });

            // Clear all active tools after a delay
            const timeoutId = setTimeout(() => {
                setActiveTools([]);
                timeoutRefs.current.delete(timeoutId);
            }, 1000);
            timeoutRefs.current.add(timeoutId);
            // Clear current assistant message ID
            setCurrentAssistantMessageId(null);
            // Clear status & thinking
            setCurrentStatus(null);
            setThinkingMessage(null);
        };

        const handleResponseUpdate = (e) => {
            const { content, delta, isThinking, new_items } = e.detail;

            // Update the current assistant message in realtime
            setMessages(prev => {
                const newMessages = [...prev];

                // Find the assistant message with current ID
                const messageIndex = newMessages.findIndex(
                    msg => msg.id === currentAssistantMessageId && msg.role === 'assistant'
                );

                if (messageIndex !== -1) {
                    // Update existing message
                    const message = newMessages[messageIndex];

                    // Update content (streaming delta or final content)
                    if (content !== undefined) {
                        if (delta) {
                            // Append delta for streaming
                            message.content = (message.content || '') + delta;
                            lastContentRef.current = message.content;
                        } else if (content && !isThinking) {
                            // Replace with final content if longer (avoid overwrite with partial)
                            if (content.length >= (message.content || '').length) {
                                message.content = content;
                                lastContentRef.current = content;
                            }
                        } else if (isThinking && content) {
                            // Append thinking content
                            message.content = (message.content || '') + '\n\n' + content;
                            lastContentRef.current = message.content;
                        }
                    }

                    // Process new_items from SDK (primary source of truth)
                    if (new_items && Array.isArray(new_items) && new_items.length > 0) {
                        // Merge new_items (avoid duplicates)
                        message.new_items = mergeNewItems(message.new_items, new_items);

                        // Extract tool_calls from new_items for backward compatibility
                        // This ensures tool_calls are always in sync with new_items
                        message.tool_calls = extractToolCallsFromNewItems(message.new_items);
                    }

                    // Debounce database updates
                    if (dbUpdateTimeoutRef.current) {
                        clearTimeout(dbUpdateTimeoutRef.current);
                    }

                    const dbId = savedMessageIds.current.get(currentAssistantMessageId);
                    if (dbId) {
                        dbUpdateTimeoutRef.current = setTimeout(() => {
                            // Extract tool_calls from new_items before saving (ensure consistency)
                            const toolCallsToSave = message.new_items && Array.isArray(message.new_items) && message.new_items.length > 0
                                ? extractToolCallsFromNewItems(message.new_items)
                                : (message.tool_calls || null);

                            axios.put('/api/chat/update', {
                                message_id: dbId,
                                content: message.content,
                                tool_calls: toolCallsToSave,
                                new_items: message.new_items, // Save new_items to DB (primary source)
                            }).catch(err => {
                                console.warn('Failed to update message in database:', err);
                            });
                        }, 500);
                    }
                } else if (content && currentAssistantMessageId) {
                    // Create new assistant message if doesn't exist
                    const newMessage = {
                        id: currentAssistantMessageId,
                        content: delta ? delta : content,
                        role: 'assistant',
                        created_at: new Date().toISOString(),
                        new_items: new_items || [],
                        tool_calls: new_items ? extractToolCallsFromNewItems(new_items) : []
                    };
                    newMessages.push(newMessage);
                    lastContentRef.current = newMessage.content;
                }

                return newMessages;
            });

            // Auto-scroll to bottom
            setTimeout(() => {
                if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }, 100);

            // Track thinking content
            if (isThinking && content) {
                setThinkingMessage(content);
            } else if (!isThinking) {
                setThinkingMessage(null);
            }
        };

        const handleStatusUpdate = (e) => {
            const { status, message, tool, success, iteration, tool_calls_count, current_turn, max_turns } = e.detail;
            const timestamp = Date.now();

            // Update current status - this will be displayed in UI
            setCurrentStatus({
                status,
                message,
                tool,
                success,
                iteration,
                tool_calls_count,
                current_turn,  // Add current turn
                max_turns,  // Add max turns
                timestamp
            });

            // Clear status after 3 seconds if it's a completed status
            if (status === 'tool_completed') {
                const timeoutId = setTimeout(() => {
                    setCurrentStatus(prev => {
                        // Only clear if it's the same status (not overwritten by newer status)
                        if (prev && prev.timestamp === timestamp) {
                            return null;
                        }
                        return prev;
                    });
                    timeoutRefs.current.delete(timeoutId);
                }, 3000);
                timeoutRefs.current.add(timeoutId);
            }
        };

        const handleStructuredThinking = (e) => {
            const { thinking, analysis, reasoning, next_steps, toolName, toolCallId } = e.detail;

            // Lưu structured thinking với toolCallId
            setToolThinkingMap(prev => {
                const newMap = new Map(prev);
                newMap.set(toolCallId, {
                    thinking,
                    analysis,
                    reasoning,
                    next_steps,
                    toolName
                });
                return newMap;
            });
        };

        const handleToolAnalysis = (e) => {
            const { toolName, toolCallId, thinking, analysis, reasoning, next_steps } = e.detail;

            // Lưu agent's analysis với toolCallId
            setToolAnalysisMap(prev => {
                const newMap = new Map(prev);
                newMap.set(toolCallId, {
                    thinking,
                    analysis,
                    reasoning,
                    next_steps,
                    toolName
                });
                return newMap;
            });
        };

        window.addEventListener('tool:started', handleToolStarted);
        window.addEventListener('tool:completed', handleToolCompleted);
        window.addEventListener('chat:completed', handleChatCompleted);
        window.addEventListener('ai:response:update', handleResponseUpdate);
        window.addEventListener('ai:status:update', handleStatusUpdate);
        window.addEventListener('thinking:structured', handleStructuredThinking);
        window.addEventListener('tool:analysis', handleToolAnalysis);
        window.addEventListener('mobile:screenshot', handleScreenshot);

        // Handle plan/task list updates
        const handlePlanUpdate = (e) => {
            const { plan, nextAction, isComplete, summary, progress } = e.detail;

            console.log('[Chat] Plan update received:', {
                plan,
                isComplete,
                progress,
                plan_steps_count: plan?.steps?.length || 0,
                progress_steps_count: progress?.steps?.length || 0
            });

            // Priority 1: Use plan.steps if available
            if (plan && plan.steps && Array.isArray(plan.steps) && plan.steps.length > 0) {
                console.log('[Chat] ✅ Setting task list from plan.steps:', plan.steps.length, 'steps');
                setTaskList(plan.steps);
                setCurrentTaskStep(plan.currentStep || 0);
                setIsTaskComplete(isComplete || false);

                // Update plan dialog state
                setCurrentPlan(plan);
                setNextAction(nextAction);
                setPlanSummary(summary);
            }
            // Priority 2: Use progress.steps if available
            else if (progress && progress.steps && Array.isArray(progress.steps) && progress.steps.length > 0) {
                console.log('[Chat] ✅ Setting task list from progress.steps:', progress.steps.length, 'steps');
                setTaskList(progress.steps);
                setCurrentTaskStep(progress.currentStep || 0);
                setIsTaskComplete(progress.isComplete || false);

                // Update plan from progress
                if (progress.plan) {
                    setCurrentPlan(progress.plan);
                    setNextAction(progress.nextAction);
                    setPlanSummary(progress.summary);
                }
            }
            // If no steps but we have plan/progress data, log for debugging
            else {
                console.warn('[Chat] ⚠️ Plan update received but no steps found:', { plan, progress });
            }
        };
        window.addEventListener('ai:plan:update', handlePlanUpdate);

        // Handle workflow updates - auto-save workflow with element information
        const handleWorkflowUpdate = async (e) => {
            const { workflow, nodes, edges, tool_calls, metadata, name, description } = e.detail;

            console.log('[Chat] Workflow update received:', {
                nodes_count: nodes?.length || 0,
                edges_count: edges?.length || 0,
                tool_calls_count: tool_calls?.length || 0,
                name
            });

            if (!workflow || !nodes || nodes.length === 0) {
                return;
            }

            // Update current workflow state
            setCurrentWorkflow({
                nodes,
                edges: edges || [],
                tool_calls: tool_calls || [],
                metadata: metadata || {},
                name: name || `Workflow - ${new Date().toLocaleString('vi-VN')}`,
                description: description || 'Auto-generated workflow from AI agent',
            });

            // Auto-save workflow to database
            try {
                const response = await axios.post(route('workflows.store'), {
                    name: name || `Workflow - ${new Date().toLocaleString('vi-VN')}`,
                    description: description || 'Auto-generated workflow from AI agent with element information',
                    nodes,
                    edges: edges || [],
                    tool_calls: tool_calls || [],
                    metadata: metadata || {},
                    category: 'ai-generated',
                    is_active: true,
                    is_public: false,
                });

                if (response.data.success && response.data.workflow) {
                    const savedWorkflow = response.data.workflow;
                    setSavedWorkflowId(savedWorkflow.id);
                    console.log('[Chat] ✅ Workflow auto-saved:', savedWorkflow.id);

                    // Show toast notification
                    toast.success(`Workflow đã được lưu: ${savedWorkflow.name}`);
                }
            } catch (error) {
                console.error('[Chat] Error auto-saving workflow:', error);
                // Don't show error toast - workflow will be available for manual save
            }
        };
        window.addEventListener('ai:workflow:update', handleWorkflowUpdate);

        return () => {
            window.removeEventListener('tool:started', handleToolStarted);
            window.removeEventListener('tool:completed', handleToolCompleted);
            window.removeEventListener('chat:completed', handleChatCompleted);
            window.removeEventListener('ai:response:update', handleResponseUpdate);
            window.removeEventListener('ai:status:update', handleStatusUpdate);
            window.removeEventListener('mobile:screenshot', handleScreenshot);
            window.removeEventListener('ai:plan:update', handlePlanUpdate);
            window.removeEventListener('ai:workflow:update', handleWorkflowUpdate);
            // Cleanup all timeouts
            timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
            timeoutRefs.current.clear();
        };
    }, [currentAssistantMessageId]);


    // Reset task list position when dialog is closed
    useEffect(() => {
        if (!showTaskList) {
            setTaskListPosition({ x: null, y: null });
            setIsDragging(false);
        }
    }, [showTaskList]);

    // Drag handlers for TaskList dialog
    useEffect(() => {
        if (!showTaskList) return;

        const handleMouseDown = (e) => {
            // Chỉ kéo khi click vào header (không phải button hoặc các element con)
            if (e.target.closest('button') || e.target.closest('svg') || e.target.closest('span')) {
                return;
            }

            // Kiểm tra xem có phải click vào drag handle không
            const dragHandle = e.target.closest('[data-drag-handle]');
            if (!dragHandle) return;

            const dialog = taskListDialogRef.current;
            if (!dialog) return;

            e.preventDefault();
            e.stopPropagation();

            const rect = dialog.getBoundingClientRect();

            // Nếu chưa có position, tính toán từ vị trí hiện tại (bottom-right)
            if (taskListPosition.x === null || taskListPosition.y === null) {
                const currentX = rect.left;
                const currentY = rect.top;
                setTaskListPosition({ x: currentX, y: currentY });
                setDragOffset({
                    x: e.clientX - currentX,
                    y: e.clientY - currentY
                });
            } else {
                setDragOffset({
                    x: e.clientX - taskListPosition.x,
                    y: e.clientY - taskListPosition.y
                });
            }

            setIsDragging(true);
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const dialog = taskListDialogRef.current;
            if (!dialog) return;

            const dialogWidth = dialog.offsetWidth;
            const dialogHeight = dialog.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // Tính toán vị trí mới
            let newX = e.clientX - dragOffset.x;
            let newY = e.clientY - dragOffset.y;

            // Giới hạn trong viewport
            newX = Math.max(0, Math.min(newX, windowWidth - dialogWidth));
            newY = Math.max(0, Math.min(newY, windowHeight - dialogHeight));

            setTaskListPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
            }
        };

        // Touch handlers for mobile
        const handleTouchStart = (e) => {
            if (e.target.closest('button') || e.target.closest('svg') || e.target.closest('span')) {
                return;
            }

            const dragHandle = e.target.closest('[data-drag-handle]');
            if (!dragHandle) return;

            const dialog = taskListDialogRef.current;
            if (!dialog) return;

            e.preventDefault();
            const touch = e.touches[0];
            const rect = dialog.getBoundingClientRect();

            if (taskListPosition.x === null || taskListPosition.y === null) {
                const currentX = rect.left;
                const currentY = rect.top;
                setTaskListPosition({ x: currentX, y: currentY });
                setDragOffset({
                    x: touch.clientX - currentX,
                    y: touch.clientY - currentY
                });
            } else {
                setDragOffset({
                    x: touch.clientX - taskListPosition.x,
                    y: touch.clientY - taskListPosition.y
                });
            }

            setIsDragging(true);
        };

        const handleTouchMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const dialog = taskListDialogRef.current;
            if (!dialog) return;

            const touch = e.touches[0];
            const dialogWidth = dialog.offsetWidth;
            const dialogHeight = dialog.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            let newX = touch.clientX - dragOffset.x;
            let newY = touch.clientY - dragOffset.y;

            newX = Math.max(0, Math.min(newX, windowWidth - dialogWidth));
            newY = Math.max(0, Math.min(newY, windowHeight - dialogHeight));

            setTaskListPosition({ x: newX, y: newY });
        };

        const handleTouchEnd = () => {
            if (isDragging) {
                setIsDragging(false);
            }
        };

        const dialog = taskListDialogRef.current;
        if (dialog) {
            const header = dialog.querySelector('[data-drag-handle]');
            if (header) {
                header.addEventListener('mousedown', handleMouseDown);
                header.addEventListener('touchstart', handleTouchStart, { passive: false });
            }
        }

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            const dialog = taskListDialogRef.current;
            if (dialog) {
                const header = dialog.querySelector('[data-drag-handle]');
                if (header) {
                    header.removeEventListener('mousedown', handleMouseDown);
                    header.removeEventListener('touchstart', handleTouchStart);
                }
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [showTaskList, isDragging, dragOffset, taskListPosition]);

    // Listen for messages from phone-viewer iframe
    useEffect(() => {
        const handleMessage = (event) => {
            // Accept messages from same origin (phone-viewer.html)
            if (event.data && typeof event.data === 'object') {
                switch (event.data.type) {
                    case 'device_selected':
                        setCurrentDeviceId(event.data.device_id);
                        console.log('Device selected:', event.data.device_id);
                        break;
                    case 'stream_started':
                        setCurrentDeviceId(event.data.device_id);
                        console.log('Stream started for device:', event.data.device_id);
                        break;
                    case 'stream_stopped':
                        if (currentDeviceId === event.data.device_id) {
                            setCurrentDeviceId(null);
                        }
                        break;
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [currentDeviceId]);

    // Tự động hiển thị FlowViewer khi có tool calls mới (optional - có thể bật lại nếu muốn)
    // useEffect(() => {
    //     const lastMessage = messages[messages.length - 1];
    //     const toolCalls = lastMessage?.tool_calls || [];
    //     const hasData = toolCalls.length > 0 || taskList.length > 0;
    //
    //     if (hasData && toolCalls.length > 0) {
    //         setShowFlowViewer(true);
    //     }
    // }, [messages.length, taskList.length]);

    const handleSelectSession = async (session) => {
        if (!session) return;
        if (sessionIdRef.current === session.session_id) {
            setShowSessionManager(false);
            setShowSidebar(false);
            return;
        }

        try {
            setSessionListLoading(true);
            const response = await axios.get(`/api/chat/sessions/${session.id}`);
            const selected = response.data.session || session;
            const sessionMessages = response.data.messages || [];
            setMessages(sessionMessages);
            setSelectedSession(selected);
            setSessionId(selected.session_id);
            updateSessionsState(selected);
            setShowSessionManager(false);
            setShowSidebar(false); // Close sidebar on mobile after selection
        } catch (error) {
            console.error('[Chat] Failed to load session messages:', error);
            alert('Không thể tải lịch sử cho session này. Vui lòng thử lại.');
        } finally {
            setSessionListLoading(false);
        }
    };

    const handleCreateSession = async () => {
        try {
            setSessionActionLoading(true);
            const response = await axios.post('/api/chat/sessions', {
                name: newSessionName || undefined,
                device_id: currentDeviceId,
                provider: selectedProvider,
                model: selectedModel,
            });
            const session = response.data.session;
            updateSessionsState(session);
            setSelectedSession(session);
            setSessionId(session.session_id);
            setMessages([]);
            setNewSessionName('');
            setShowSidebar(false); // Close sidebar on mobile after creation
        } catch (error) {
            console.error('[Chat] Failed to create session:', error);
            alert('Không thể tạo session mới. Vui lòng thử lại.');
        } finally {
            setSessionActionLoading(false);
        }
    };

    const handleDeleteSession = async (sessionId) => {
        const session = sessions.find(s => s.id === sessionId);
        const sessionName = session?.name || 'session này';

        confirmDialog({
            title: 'Xóa session',
            message: `Bạn có chắc chắn muốn xóa "${sessionName}"?`,
            description: 'Hành động này không thể hoàn tác.',
            variant: 'danger',
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            onConfirm: async () => {
        try {
            const response = await axios.delete(`/api/chat/sessions/${sessionId}`);
            if (response.data.success) {
                // Remove from sessions list
                setSessions(prev => prev.filter(s => s.id !== sessionId));

                // If deleted session was active, clear it
                if (selectedSession?.id === sessionId) {
                    setSelectedSession(null);
                    setSessionId('');
                    setMessages([]);
                }

                // Refresh sessions list
                refreshSessions();
                        toast.success('Đã xóa session thành công');
                    } else {
                        toast.error('Không thể xóa session. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('[Chat] Failed to delete session:', error);
                    toast.error('Không thể xóa session. Vui lòng thử lại.');
        }
            },
        });
    };

    // Clear chat history
    const handleClearHistory = async () => {
        confirmDialog({
            title: 'Xóa lịch sử chat',
            message: 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat?',
            description: 'Hành động này không thể hoàn tác.',
            variant: 'danger',
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            onConfirm: async () => {
        try {
            const response = await axios.delete('/api/chat/clear', {
                data: selectedSession?.session_id ? { session_id: selectedSession.session_id } : {}
            });

            if (response.data.success) {
                setMessages([]);
                        toast.success('Đã xóa lịch sử chat thành công');
                if (selectedSession) {
                    const updatedSession = {
                        ...selectedSession,
                        last_message_at: null,
                    };
                    setSelectedSession(updatedSession);
                    updateSessionsState(updatedSession);
                }
            } else {
                        toast.error('Lỗi khi xóa lịch sử chat: ' + (response.data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error clearing chat history:', error);
                    toast.error('Lỗi khi xóa lịch sử chat: ' + (error.response?.data?.message || error.message));
        }
            },
        });
    };

    const handleStop = async () => {
        // Abort HTTP request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // Send stop signal to agent-bridge via WebSocket or HTTP
        const activeSessionId = sessionIdRef.current || sessionId;
        if (activeSessionId) {
            try {
                // Try WebSocket first (faster)
                const wsEvent = new CustomEvent('websocket:send', {
                    detail: {
                        type: 'ai:chat:stop',
                        session_id: activeSessionId
                    }
                });
                window.dispatchEvent(wsEvent);

                // Also try HTTP endpoint as fallback
                const agentBridgeUrl = 'http://127.0.0.1:3001';
                await axios.post(`${agentBridgeUrl}/api/ai/chat/stop`, {
                    session_id: activeSessionId
                }).catch(error => {
                    // Ignore errors - WebSocket might have already handled it
                    console.log('[Chat] Stop signal sent (HTTP fallback may have failed, but WebSocket should handle it)');
                });
            } catch (error) {
                console.warn('[Chat] Error sending stop signal:', error);
            }
        }

        setIsLoading(false);
        setCurrentAssistantMessageId(null);
        setCurrentStatus(null);
        setThinkingMessage(null);

        // Update last assistant message to show it was stopped
        setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.content) {
                lastMessage.content = '⚠️ Đã dừng bởi người dùng.';
            }
            return newMessages;
        });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        // Check if device ID is selected
        if (!currentDeviceId) {
            setShowDeviceSelector(true);
            return;
        }

        const userMessage = {
            id: Date.now(),
            content: input,
            role: 'user',
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setCurrentStatus(null);
        setThinkingMessage(null);

        // Create AbortController để có thể stop request
        abortControllerRef.current = new AbortController();

        // Create placeholder assistant message for realtime updates
        const assistantMessageId = Date.now() + 1;
        setCurrentAssistantMessageId(assistantMessageId);

        const placeholderMessage = {
            id: assistantMessageId,
            content: '',
            role: 'assistant',
            created_at: new Date().toISOString(),
            tool_calls: null,
            iterations: 0
        };

        setMessages((prev) => [...prev, placeholderMessage]);

        try {
            // Đảm bảo đã có session hợp lệ trước khi gửi tin nhắn
            const activeSessionId = await ensureSessionReady();

            // Gửi trực tiếp tới agent-bridge
            const agentBridgeUrl = 'http://127.0.0.1:3001';

            // Get API key for selected provider
            const apiKey = (apiKeys[selectedProvider] || '').trim();

            if (!apiKey) {
                alert(`Vui lòng nhập API key cho ${selectedProvider.toUpperCase()} trong Settings`);
                setIsLoading(false);
                setCurrentAssistantMessageId(null);
                // Remove placeholder message
                setMessages((prev) => prev.filter(msg => msg.id !== assistantMessageId));
                return;
            }

            console.log(`[Chat] Sending request with provider: ${selectedProvider}, model: ${selectedModel}, has_api_key: ${!!apiKey}`);

            // Send request - response will come via WebSocket realtime
            const aiResponse = await axios.post(`${agentBridgeUrl}/api/ai/chat`, {
                message: userMessage.content,
                device_id: currentDeviceId,
                provider: selectedProvider,
                model: selectedModel,
                api_key: apiKey, // Gửi API key từ frontend
                session_id: activeSessionId,
                max_turns: maxTurns, // Gửi max_turns từ frontend
                context: {
                    // Không gửi context để tránh vượt token limit - agent sẽ tự quản lý
                    // Chỉ gửi message hiện tại, không gửi history
                    chat_history: []
                }
                // Không gửi backend_url nữa vì dùng direct API calls
            }, {
                signal: abortControllerRef.current?.signal // Support abort
            });

            if (aiResponse.data.session_id && aiResponse.data.session_id !== sessionIdRef.current) {
                setSessionId(aiResponse.data.session_id);
            }

            // Check for errors in response
            if (!aiResponse.data.success || aiResponse.data.error) {
                const errorMessage = aiResponse.data.error || aiResponse.data.content || 'Đã xảy ra lỗi không xác định';
                const errorMsg = {
                    id: Date.now(),
                    content: errorMessage,
                    role: 'assistant',
                    created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, errorMsg]);
                setIsLoading(false);
                setCurrentAssistantMessageId(null);
                // Remove placeholder message
                setMessages((prev) => prev.filter(msg => msg.id !== assistantMessageId));
                return;
            }

            // Final update with complete response (in case WebSocket missed it)
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.id === assistantMessageId) {
                    // Update content from HTTP response (fallback if WebSocket missed it)
                    if (aiResponse.data.final_output || aiResponse.data.content) {
                        const finalContent = aiResponse.data.final_output || aiResponse.data.content;
                        if (finalContent && finalContent !== lastMessage.content) {
                            lastMessage.content = finalContent;
                        }
                    }

                    // Update new_items from SDK (primary source of truth)
                    if (aiResponse.data.new_items && Array.isArray(aiResponse.data.new_items)) {
                        lastMessage.new_items = aiResponse.data.new_items;
                        // Extract tool_calls from new_items (ensures consistency)
                        lastMessage.tool_calls = extractToolCallsFromNewItems(aiResponse.data.new_items);
                    } else if (aiResponse.data.tool_calls && Array.isArray(aiResponse.data.tool_calls)) {
                        // Backward compatibility: if no new_items, use tool_calls directly
                        lastMessage.tool_calls = aiResponse.data.tool_calls;
                    }

                    lastMessage.iterations = aiResponse.data.iterations || 0;
                    // Add script info if available
                    if (aiResponse.data.script) {
                        lastMessage.script = aiResponse.data.script;
                    }
                }
                return newMessages;
            });

            // Lưu user message vào database ngay lập tức
            // Assistant message sẽ được lưu sau khi chat completed (trong handleChatCompleted)
                axios.post('/api/chat/save', {
                    user_message: {
                        content: userMessage.content,
                    },
                    assistant_message: {
                    content: '', // Placeholder - will be updated when chat completes
                    tool_calls: null,
                    iterations: 0,
                    },
                    device_id: currentDeviceId,
                    session_id: activeSessionId,
                    provider: selectedProvider,
                    model: selectedModel,
                }).then(saveResponse => {
                    // Lưu mapping message ID -> database ID
                    if (saveResponse.data.success) {
                        if (saveResponse.data.user_message?.id) {
                            savedMessageIds.current.set(userMessage.id, saveResponse.data.user_message.id);
                        }
                        if (saveResponse.data.assistant_message?.id) {
                            savedMessageIds.current.set(assistantMessageId, saveResponse.data.assistant_message.id);
                        }
                    }
                }).catch(saveError => {
                console.warn('Failed to save messages to database:', saveError);
            });

            if (selectedSession) {
                const updatedSession = {
                    ...selectedSession,
                    last_message_at: new Date().toISOString(),
                };
                setSelectedSession(updatedSession);
                updateSessionsState(updatedSession);
            }
        } catch (error) {
            // Ignore abort errors
            if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
                console.log('[Chat] Request was cancelled by user');
                return;
            }

            console.error('Error sending message:', error);
            const errorMessage = {
                id: Date.now(),
                content: error.response?.data?.content || error.response?.data?.error || 'Lỗi khi gửi tin nhắn. Vui lòng thử lại.',
                role: 'assistant',
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    return (
        <>
            <Head title="Chat với Android Streaming" />
            <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
                {/* Sidebar */}
                <ChatSidebar
                    sessions={sessions}
                    activeSession={selectedSession}
                    onSelectSession={handleSelectSession}
                    onCreateSession={handleCreateSession}
                    onDeleteSession={handleDeleteSession}
                    isOpen={showSidebar}
                    onClose={() => setShowSidebar(false)}
                    currentDeviceId={currentDeviceId}
                    onDeviceChange={() => setShowDeviceSelector(true)}
                />

                {/* Overlay for mobile */}
                {showSidebar && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 md:hidden"
                        onClick={() => setShowSidebar(false)}
                    ></div>
                )}

                {/* Main Content Wrapper - Flex container để responsive với sidebar */}
                <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${showSidebar ? 'md:ml-80' : 'ml-0'}`}>
                    {/* Connection Status Banner - Enhanced */}
                    {!wsConnected && (
                        <div className="w-full shrink-0 px-4 sm:px-6 pt-4">
                            <div className="p-4 text-sm text-red-800 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 dark:text-red-300 border-2 border-red-200 dark:border-red-800 shadow-lg" role="alert">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-base">⚠️ Chưa kết nối Agent Bridge</span>
                                            <span className="text-xs mt-1 text-red-700 dark:text-red-300">
                                                WebSocket chưa kết nối. Vui lòng đảm bảo Agent Bridge đang chạy tại <span className="font-mono font-semibold">ws://127.0.0.1:3002</span>
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="text-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg p-2 inline-flex items-center justify-center transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Header với Device Info - Professional Design */}
                    <div className="w-full px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                            {/* Avatar - Professional */}
                            <div className="w-12 h-12 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3 flex-wrap">
                                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">AI Assistant</h1>
                                    {/* WebSocket Connection Indicator - Enhanced */}
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                                        wsConnected
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'
                                    }`}>
                                        <span className={`relative flex h-2 w-2 ${
                                            wsConnected ? '' : 'animate-pulse'
                                        }`}>
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                                                wsConnected
                                                    ? 'bg-green-400 opacity-75'
                                                    : 'bg-red-400 opacity-75'
                                            }`}></span>
                                            <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                                wsConnected
                                                    ? 'bg-green-500'
                                                    : 'bg-red-500'
                                            }`}></span>
                                        </span>
                                        <span className="hidden sm:inline font-medium">
                                            {wsConnected ? 'Đã kết nối' : 'Chưa kết nối'}
                                        </span>
                                    </span>
                                </div>
                                {user && (
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Xin chào,</span>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-200">{user.name}</span>
                                    </div>
                                )}
                                {/* Real-time Status Display - Professional */}
                                {currentStatus && (
                                    <div className="flex items-center space-x-2 mt-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-md">
                                        <div className={`relative flex h-2 w-2 ${
                                            currentStatus.status === 'thinking' || currentStatus.status === 'planning'
                                                ? 'animate-pulse'
                                                : currentStatus.status === 'executing_tool'
                                                ? 'animate-pulse'
                                                : ''
                                        }`}>
                                            {currentStatus.status === 'thinking' || currentStatus.status === 'planning' || currentStatus.status === 'executing_tool' ? (
                                                <>
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 dark:bg-gray-500 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-600 dark:bg-gray-400"></span>
                                                </>
                                            ) : (
                                                <span className={`inline-flex rounded-full h-2 w-2 ${
                                                    currentStatus.success === false
                                                        ? 'bg-red-500'
                                                        : 'bg-green-500'
                                                }`}></span>
                                            )}
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{currentStatus.message}</span>
                                        {/* Turn indicator */}
                                        {currentStatus.current_turn && currentStatus.max_turns && (
                                            <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                                                Turn {currentStatus.current_turn}/{currentStatus.max_turns}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {/* Thinking text preview - Professional */}
                                {thinkingMessage && (
                                    <div className="mt-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-md">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">💭</span>
                                            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate" title={thinkingMessage}>
                                                {thinkingMessage}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {/* Theme Toggle Button */}
                            <button
                                onClick={toggleTheme}
                                className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                                title={theme === 'dark' ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
                            >
                                {theme === 'dark' ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>
                            {/* Flow Viewer Toggle Button */}
                            {(() => {
                                const lastMessage = messages[messages.length - 1];
                                // Extract tool_calls from new_items if available
                                const toolCalls = lastMessage?.new_items && Array.isArray(lastMessage.new_items) && lastMessage.new_items.length > 0
                                    ? extractToolCallsFromNewItems(lastMessage.new_items)
                                    : (lastMessage?.tool_calls || []);
                                const hasToolCalls = toolCalls && toolCalls.length > 0;
                                const hasTasks = taskList.length > 0;
                                const canShowFlow = hasToolCalls || hasTasks || currentWorkflow;

                                if (!canShowFlow) return null;

                                return (
                                    <div className="flex items-center space-x-2">
                                        {/* Replay Workflow Button */}
                                        {currentWorkflow && currentWorkflow.tool_calls && currentWorkflow.tool_calls.length > 0 && (
                                            <button
                                                onClick={async () => {
                                                    if (!currentDeviceId) {
                                                        setShowDeviceSelector(true);
                                                        return;
                                                    }

                                                    // Replay workflow by sending tool calls to agent
                                                    try {
                                                        setIsLoading(true);
                                                        const workflowToolCalls = currentWorkflow.tool_calls;

                                                        // Create a message describing the workflow replay
                                                        const replayMessage = `Replay workflow: ${currentWorkflow.name || 'Workflow'}`;

                                                        // Send replay request to agent
                                                        const activeSessionId = await ensureSessionReady();
                                                        const agentBridgeUrl = 'http://127.0.0.1:3001';
                                                        const apiKey = (apiKeys[selectedProvider] || '').trim();

                                                        if (!apiKey) {
                                                            alert(`Vui lòng nhập API key cho ${selectedProvider.toUpperCase()} trong Settings`);
                                                            setIsLoading(false);
                                                            return;
                                                        }

                                                        // Send workflow replay request
                                                        await axios.post(`${agentBridgeUrl}/api/ai/chat`, {
                                                            message: replayMessage,
                                                            device_id: currentDeviceId,
                                                            provider: selectedProvider,
                                                            model: selectedModel,
                                                            api_key: apiKey,
                                                            session_id: activeSessionId,
                                                            max_turns: maxTurns,
                                                            workflow_replay: {
                                                                tool_calls: workflowToolCalls,
                                                                workflow_id: savedWorkflowId,
                                                            },
                                                            context: {
                                                                chat_history: []
                                                            }
                                                        });

                                                        toast.success('Đang replay workflow...');
                                                    } catch (error) {
                                                        console.error('[Chat] Error replaying workflow:', error);
                                                        toast.error('Lỗi khi replay workflow: ' + (error.response?.data?.error || error.message));
                                                        setIsLoading(false);
                                                    }
                                                }}
                                                className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 shrink-0 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40 border border-green-300 dark:border-green-700"
                                                title="Replay Workflow"
                                                disabled={isLoading}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm font-medium">Replay</span>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setShowFlowViewer(!showFlowViewer)}
                                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 shrink-0 ${
                                                showFlowViewer
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-700'
                                                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-700'
                                            }`}
                                            title="Xem Workflow Flow"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                            </svg>
                                            <span className="text-sm font-medium">Flow</span>
                                        </button>
                                    </div>
                                );
                            })()}
                            {/* Sidebar Toggle Button - Professional */}
                            <button
                                onClick={() => setShowSidebar(!showSidebar)}
                                className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-700 transition-all duration-200 shrink-0 group"
                                title="Lịch sử sessions"
                            >
                                <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </div>
                                <div className="flex flex-col items-start leading-tight">
                                    <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Session</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-gray-200 truncate max-w-[140px]" title={selectedSession?.name || selectedSession?.session_id || 'Chưa có session'}>
                                        {selectedSession?.name || selectedSession?.session_id || 'Session mới'}
                                    </span>
                                </div>
                            </button>
                            <button
                                onClick={() => setShowDeviceSelector(true)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 shrink-0 shadow-sm hover:shadow-md ${
                                    currentDeviceId
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 border-2 border-green-300 dark:border-green-700'
                                        : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-red-300 dark:border-red-700'
                                }`}
                                title={currentDeviceId ? 'Thay đổi thiết bị' : 'Chọn thiết bị (Bắt buộc)'}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs font-medium">
                                    {currentDeviceId ? `${currentDeviceId.substring(0, 12)}...` : 'Chọn thiết bị'}
                                </span>
                                {!currentDeviceId && (
                                    <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </button>
                            {messages.length > 0 && (
                                <button
                                    onClick={handleClearHistory}
                                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-300 rounded-lg transition-colors duration-200 shrink-0"
                                    title="Xóa lịch sử chat"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span className="text-sm font-medium">Clear</span>
                                </button>
                            )}
                            <button
                                onClick={() => setShowTaskList(!showTaskList)}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 shrink-0 ${
                                    showTaskList
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                                title={showTaskList ? 'Ẩn Task List' : 'Hiện Task List'}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="text-sm font-medium">Tasks</span>
                                {taskList.length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-blue-500 text-white rounded-full">
                                        {taskList.filter((t, idx) => t.completed || idx < currentTaskStep).length}/{taskList.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setShowApiKeySettings(true)}
                                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-300 rounded-lg transition-colors duration-200 shrink-0"
                                title="API Keys Settings"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-sm font-medium">API Keys</span>
                            </button>
                            <button
                                onClick={() => setShowPhoneModal(true)}
                                className="flex items-center space-x-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg transition-colors duration-200 shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-medium">View Phone</span>
                            </button>

                            {/* User Menu */}
                            {user && (
                                <div className="relative group">
                                    <button
                                        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-200 rounded-lg transition-colors duration-200 shrink-0"
                                        title={`${user.name} (${user.email})`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-xs font-semibold">
                                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="hidden md:flex flex-col items-start leading-tight">
                                            <span className="text-xs font-medium text-gray-900 dark:text-gray-200 truncate max-w-[120px]">
                                                {user.name}
                                            </span>
                                            <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                                                {user.email}
                                            </span>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">{user.email}</div>
                                            {user.email_verified_at && (
                                                <div className="flex items-center space-x-1 mt-2">
                                                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-xs text-green-600 dark:text-green-400">Đã xác thực email</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-1">
                                            <button
                                                onClick={() => {
                                                    router.post('/logout');
                                                }}
                                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                <span>Đăng xuất</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    </div>

                    {/* Main Content Area - Chat Full Screen - Professional */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-h-0 overflow-hidden">
                    {/* Messages Area - Enhanced */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-10 pb-6 min-h-0 scroll-smooth">
                        <div className="max-w-4xl mx-auto">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center py-20 px-4">
                                    {/* Avatar - Professional */}
                                    <div className="mb-8">
                                        <div className="w-24 h-24 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                                            <svg className="w-12 h-12 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-semibold mb-4 text-gray-900 dark:text-white">
                                        Chào mừng đến với AI Assistant
                                    </h3>
                                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mb-10 leading-relaxed">
                                        Tôi có thể giúp bạn điều khiển thiết bị Android và trả lời các câu hỏi của bạn.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                                        <div className="group p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-md">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                                    <span className="text-2xl">📱</span>
                                                </div>
                                                <div className="text-lg font-semibold text-gray-900 dark:text-white">Điều khiển thiết bị</div>
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                                Chụp ảnh màn hình, click, swipe, nhập text và nhiều hơn nữa...
                                            </div>
                                        </div>
                                        <div className="group p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-md">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                                    <span className="text-2xl">🤖</span>
                                                </div>
                                                <div className="text-lg font-semibold text-gray-900 dark:text-white">Tự động hóa</div>
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                                Thực hiện các tác vụ phức tạp tự động với AI thông minh
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {messages.map((message, index) => {
                                // Group messages by date
                                const messageDate = new Date(message.timestamp || message.created_at || Date.now());
                                const prevMessageDate = index > 0
                                    ? new Date(messages[index - 1].timestamp || messages[index - 1].created_at || Date.now())
                                    : null;

                                const showDateDivider = !prevMessageDate ||
                                    messageDate.toDateString() !== prevMessageDate.toDateString();

                                return (
                                    <div key={message.id}>
                                        {showDateDivider && (
                                            <div className="flex items-center my-8">
                                                <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
                                                <span className="px-4 py-1.5 text-xs text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wide bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-700">
                                                    {messageDate.toLocaleDateString('vi-VN', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                                <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
                                            </div>
                                        )}
                                        <ChatMessage
                                            message={message}
                                            toolThinkingMap={toolThinkingMap}
                                            toolAnalysisMap={toolAnalysisMap}
                                        />
                                        {/* Show typing indicator after last message if streaming */}
                                        {index === messages.length - 1 &&
                                         message.role === 'assistant' &&
                                         currentAssistantMessageId === message.id &&
                                         isLoading && (
                                            <TypingIndicator isVisible={true} />
                                        )}
                                    </div>
                                );
                            })}

                            {/* Show typing indicator if no messages yet but loading */}
                            {messages.length === 0 && isLoading && (
                                <>
                                    <MessageSkeleton isUser={false} />
                                    <TypingIndicator isVisible={true} />
                                </>
                            )}

                            {/* Tool Execution Indicator - Enhanced với hiển thị rõ ràng hơn */}
                            {activeTools.length > 0 && (
                                <div className="mt-4 space-y-3">
                                    {/* Header cho Tool Execution */}
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                                            Agent đang thực thi ({activeTools.filter(t => t.status === 'running').length} tool{activeTools.filter(t => t.status === 'running').length > 1 ? 's' : ''})
                                        </span>
                                    </div>

                                    {activeTools.map((toolInfo, idx) => {
                                        // Unified Mobile Task Agent uses all mobile_* tools directly
                                        const isMobileTool = toolInfo.tool && toolInfo.tool.startsWith('mobile_');
                                        const toolDisplayName = toolInfo.tool
                                            .replace('mobile_', '')
                                            .replace(/_/g, ' ')
                                            .split(' ')
                                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                            .join(' ');

                                        return (
                                            <div
                                                key={`${toolInfo.tool}-${toolInfo.toolCall?.id || idx}`}
                                                className={`flex items-start space-x-4 px-5 py-4 rounded-xl border-2 shadow-lg transition-all duration-300 ${
                                                    toolInfo.status === 'running'
                                                        ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/40 dark:via-indigo-900/40 dark:to-blue-800/40 border-blue-400 dark:border-blue-600 ring-2 ring-blue-200 dark:ring-blue-800'
                                                        : toolInfo.status === 'completed'
                                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-700'
                                                        : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-red-300 dark:border-red-700'
                                                }`}
                                            >
                                                <div className="shrink-0 mt-0.5">
                                                    {toolInfo.status === 'running' && (
                                                        <div className="relative">
                                                            <div className="w-6 h-6 border-3 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                                            <div className="absolute inset-0 w-6 h-6 border-3 border-blue-300 dark:border-blue-600 border-r-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                                                        </div>
                                                    )}
                                                    {toolInfo.status === 'completed' && (
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    {toolInfo.status === 'error' && (
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
                                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                                        {isMobileTool && (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                </svg>
                                                                MOBILE
                                                            </span>
                                                        )}
                                                        <div className={`text-base font-bold ${
                                                            toolInfo.status === 'running' ? 'text-blue-700 dark:text-blue-300' :
                                                            toolInfo.status === 'completed' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                                                        }`}>
                                                            {toolDisplayName}
                                                        </div>
                                                        {toolInfo.status === 'running' && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 animate-pulse">
                                                                ĐANG CHẠY
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Show tool arguments if available */}
                                                    {toolInfo.toolCall?.function?.arguments && toolInfo.status === 'running' && (
                                                        <div className="mt-2 px-3 py-2 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700">
                                                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Tham số:</div>
                                                            <div className="text-xs font-mono text-gray-800 dark:text-gray-200 break-all">
                                                                {typeof toolInfo.toolCall.function.arguments === 'string'
                                                                    ? toolInfo.toolCall.function.arguments
                                                                    : JSON.stringify(toolInfo.toolCall.function.arguments, null, 2)}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {toolInfo.status === 'running' && (
                                                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                            <div className="flex gap-1">
                                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                                            </div>
                                                            <span>Đang xử lý tool call...</span>
                                                        </div>
                                                    )}

                                                    {/* Show result preview for completed tools */}
                                                    {toolInfo.status === 'completed' && toolInfo.result && (
                                                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                                            <span className="font-semibold">Kết quả:</span> {typeof toolInfo.result === 'string'
                                                                ? (toolInfo.result.length > 100 ? toolInfo.result.substring(0, 100) + '...' : toolInfo.result)
                                                                : 'Đã hoàn thành'}
                                                        </div>
                                                    )}

                                                    {/* Show error for failed tools */}
                                                    {toolInfo.status === 'error' && (
                                                        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                                                            <span className="font-semibold">Lỗi:</span> {typeof toolInfo.result === 'string'
                                                                ? toolInfo.result
                                                                : 'Tool execution failed'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {isLoading && (
                                <div className="flex justify-start py-4">
                                    <div className="flex items-center space-x-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} className="h-1" />
                        </div>
                    </div>

                    {/* Chat Input - Professional */}
                    <div className="px-4 sm:px-6 pt-4 pb-6 bg-white dark:bg-gray-900 shrink-0 border-t border-gray-200 dark:border-gray-800">
                        <div className="max-w-4xl mx-auto">
                            <ChatInput
                                value={input}
                                onChange={setInput}
                                onSubmit={handleSendMessage}
                                disabled={isLoading}
                                isLoading={isLoading}
                                onStop={handleStop}
                                currentStatus={currentStatus}
                                thinkingMessage={thinkingMessage}
                            />
                            {sessionId && (
                                <div className="mt-4 flex items-center justify-center space-x-2">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Session ID:</span>
                                    <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">{sessionId}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            </div>

            {/* Modals and Overlays - Outside main container but inside fragment */}
            {/* API Keys Settings Modal */}
                {showApiKeySettings && (
                    <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
                                    <button
                                        onClick={() => setShowApiKeySettings(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Max Turns Configuration */}
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            Max Turns (Giới hạn số lần agent chạy)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="9999"
                                            value={maxTurns}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value, 10);
                                                if (value >= 1 && value <= 9999) {
                                                    setMaxTurns(value);
                                                    localStorage.setItem('ai_max_turns', value.toString());
                                                }
                                            }}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-400 dark:focus:border-gray-400 block w-full p-2.5"
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Số turn tối đa agent có thể thực hiện (1-9999). Mặc định: 9999 (không giới hạn).
                                            Đặt 9999 để agent chạy cho đến khi hoàn thành task. Turn hiện tại sẽ được hiển thị trong status.
                                        </p>
                                    </div>

                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">API Keys</h3>
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            OpenAI API Key
                                        </label>
                                        <input
                                            type="password"
                                            value={apiKeys.openai}
                                            onChange={(e) => {
                                                const newKeys = {
                                                    ...apiKeys,
                                                    openai: e.target.value
                                                };
                                                setApiKeys(newKeys);
                                                // Save with trimmed value
                                                const trimmedKeys = {
                                                    ...newKeys,
                                                    openai: e.target.value.trim()
                                                };
                                                localStorage.setItem('ai_api_keys', JSON.stringify(trimmedKeys));
                                            }}
                                            placeholder="sk-..."
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-400 dark:focus:border-gray-400 block w-full p-2.5"
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-white hover:underline font-medium">OpenAI Platform</a>
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            Google Gemini API Key
                                        </label>
                                        <input
                                            type="password"
                                            value={apiKeys.gemini}
                                            onChange={(e) => {
                                                const newKeys = {
                                                    ...apiKeys,
                                                    gemini: e.target.value
                                                };
                                                setApiKeys(newKeys);
                                                // Save with trimmed value
                                                const trimmedKeys = {
                                                    ...newKeys,
                                                    gemini: e.target.value.trim()
                                                };
                                                localStorage.setItem('ai_api_keys', JSON.stringify(trimmedKeys));
                                            }}
                                            placeholder="AIza..."
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-400 dark:focus:border-gray-400 block w-full p-2.5"
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-white hover:underline font-medium">Google AI Studio</a>
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            Anthropic Claude API Key
                                        </label>
                                        <input
                                            type="password"
                                            value={apiKeys.claude}
                                            onChange={(e) => {
                                                const newKeys = {
                                                    ...apiKeys,
                                                    claude: e.target.value
                                                };
                                                setApiKeys(newKeys);
                                                // Save with trimmed value
                                                const trimmedKeys = {
                                                    ...newKeys,
                                                    claude: e.target.value.trim()
                                                };
                                                localStorage.setItem('ai_api_keys', JSON.stringify(trimmedKeys));
                                            }}
                                            placeholder="sk-ant-..."
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-400 dark:focus:border-gray-400 block w-full p-2.5"
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-white hover:underline font-medium">Anthropic Console</a>
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => setShowApiKeySettings(false)}
                                        className="text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-600 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showSessionManager && (
                    <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 flex items-center justify-center z-50 px-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl border border-gray-200 dark:border-gray-700">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quản lý Session</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Tạo session mới hoặc chọn session đã lưu để tiếp tục cuộc trò chuyện.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowSessionManager(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
                                    <input
                                        type="text"
                                        value={newSessionName}
                                        onChange={(e) => setNewSessionName(e.target.value)}
                                        placeholder="Tên session (tuỳ chọn)"
                                        className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-400 dark:focus:border-gray-400 px-3 py-2"
                                    />
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={handleCreateSession}
                                            disabled={sessionActionLoading}
                                            className="text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-600 font-medium rounded-lg text-sm px-4 py-2 text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {sessionActionLoading ? 'Đang tạo...' : 'Session mới'}
                                        </button>
                                        <button
                                            onClick={refreshSessions}
                                            disabled={sessionListLoading}
                                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                        >
                                            {sessionListLoading ? 'Đang tải...' : 'Refresh'}
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-[360px] overflow-y-auto space-y-3">
                                    {sessions.length === 0 && (
                                        <div className="text-center text-gray-600 dark:text-gray-400 py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                            Chưa có session nào. Tạo session mới để bắt đầu.
                                        </div>
                                    )}
                                    {sessions.map((session) => {
                                        const isActive = selectedSession?.id === session.id;
                                        return (
                                            <div
                                                key={session.id}
                                                className={`p-4 rounded-lg border transition-colors ${
                                                    isActive ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700/50' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                                }`}
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {session.name || 'Session không tên'}
                                                        </div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                            ID: <span className="font-mono">{session.session_id}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                            Lần cuối: {session.last_message_at ? new Date(session.last_message_at).toLocaleString() : 'Chưa có'}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard?.writeText(session.session_id);
                                                            }}
                                                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-200 rounded-lg text-xs transition-colors font-medium"
                                                        >
                                                            Copy ID
                                                        </button>
                                                        <button
                                                            onClick={() => handleSelectSession(session)}
                                                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                                                isActive
                                                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                            }`}
                                                        >
                                                            {isActive ? 'Đang dùng' : 'Sử dụng'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            <DraggablePhoneViewer
                isOpen={showPhoneModal}
                onClose={() => setShowPhoneModal(false)}
            />

            <DeviceSelector
                isOpen={showDeviceSelector}
                onClose={() => {
                    // Don't allow closing if no device is selected
                    if (currentDeviceId) {
                        setShowDeviceSelector(false);
                    }
                }}
                onSelectDevice={handleSelectDevice}
                currentDeviceId={currentDeviceId}
            />

            {/* Flow Viewer - Hiển thị workflow dưới dạng flow diagram */}
            {(() => {
                // Lấy tool calls từ message cuối cùng - extract from new_items if available
                const lastMessage = messages[messages.length - 1];
                const toolCalls = lastMessage?.new_items && Array.isArray(lastMessage.new_items) && lastMessage.new_items.length > 0
                    ? extractToolCallsFromNewItems(lastMessage.new_items)
                    : (lastMessage?.tool_calls || []);

                // Chỉ hiển thị nếu có tool calls hoặc tasks và user đã click nút
                const hasData = toolCalls.length > 0 || taskList.length > 0;

                if (!hasData || !showFlowViewer) return null;

                return (
                    <FlowViewer
                        isOpen={showFlowViewer}
                        onClose={() => setShowFlowViewer(false)}
                        toolCalls={toolCalls}
                        tasks={taskList}
                        autoShow={false}
                        workflowId={savedWorkflowId} // Use auto-saved workflow ID
                        onWorkflowSaved={(workflow) => {
                            console.log('Workflow saved:', workflow);
                            setSavedWorkflowId(workflow.id);
                            toast.success(`Workflow đã được lưu: ${workflow.name}`);
                        }}
                        workflowName={currentWorkflow?.name || `Workflow - ${new Date().toLocaleString('vi-VN')}`}
                        nodes={currentWorkflow?.nodes} // Use auto-generated nodes with element info
                        edges={currentWorkflow?.edges} // Use auto-generated edges
                    />
                );
            })()}

            {/* Task List Dialog - Floating ở góc dưới bên phải - Draggable */}
            {showTaskList && (
                <div
                    ref={taskListDialogRef}
                    className={`fixed z-50 w-[calc(100vw-2rem)] md:w-[420px] max-h-[70vh] md:max-h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-none ${isDragging ? 'cursor-grabbing' : ''} ${taskListPosition.x === null ? 'bottom-4 right-4 md:bottom-6 md:right-6 animate-slideInUp' : ''}`}
                    style={taskListPosition.x !== null ? {
                        left: `${taskListPosition.x}px`,
                        top: `${taskListPosition.y}px`,
                        bottom: 'auto',
                        right: 'auto'
                    } : {}}
                >
                    {/* Header với nút đóng và collapse - Draggable handle */}
                    <div
                        data-drag-handle
                        className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
                    >
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Task List</h3>
                                {taskList.length > 0 && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {taskList.filter(t => t.completed || taskList.indexOf(t) < currentTaskStep).length}/{taskList.length} completed
                                    </p>
                                )}
                            </div>
                            {/* Drag indicator */}
                            <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isTaskComplete && (
                                <div className="px-2 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Done
                                </div>
                            )}
                            <button
                                onClick={() => setShowTaskList(false)}
                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Đóng"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Task List Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 min-h-0">
                        {taskList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Chưa có task nào</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">Agent sẽ hiển thị plan khi bắt đầu</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {taskList.map((task, index) => {
                                    const isActive = index === currentTaskStep;
                                    const isCompleted = task.completed || index < currentTaskStep;

                                    return (
                                        <div
                                            key={task.stepNumber || index}
                                            className={`
                                                group relative rounded-lg border transition-all duration-200 p-3
                                                ${isActive
                                                    ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-md ring-1 ring-blue-500/20'
                                                    : isCompleted
                                                        ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Status Icon */}
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {isCompleted ? (
                                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    ) : isActive ? (
                                                        <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                                            <div className="absolute inset-0 rounded-lg bg-blue-400 animate-ping opacity-75"></div>
                                                            <div className="relative w-2 h-2 bg-white rounded-full"></div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                            {index + 1}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Task Content */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`
                                                        text-sm font-semibold leading-snug truncate
                                                        ${isActive
                                                            ? 'text-blue-900 dark:text-blue-100'
                                                            : isCompleted
                                                                ? 'text-green-900 dark:text-green-100'
                                                                : 'text-gray-900 dark:text-gray-100'
                                                        }
                                                    `}>
                                                        {task.description || task.action || `Task ${index + 1}`}
                                                    </h4>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer với progress bar */}
                    {taskList.length > 0 && (
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center justify-between text-xs mb-2">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Tiến độ</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {Math.round((taskList.filter(t => t.completed || taskList.indexOf(t) < currentTaskStep).length / taskList.length) * 100)}%
                                </span>
                            </div>
                            <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${(taskList.filter(t => t.completed || taskList.indexOf(t) < currentTaskStep).length / taskList.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Plan Dialog - Professional */}
            <PlanDialog
                plan={currentPlan}
                isOpen={showPlanDialog}
                onClose={() => setShowPlanDialog(false)}
                nextAction={nextAction}
                isComplete={isTaskComplete}
                summary={planSummary}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogProps} />
        </>
    );
}

