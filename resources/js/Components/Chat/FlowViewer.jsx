import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from '../../Contexts/ThemeContext';
import axios from 'axios';
import route from '../../Utils/route';

// Custom node component - Enhanced với thông tin từ agent
const CustomNode = ({ data, selected }) => {
    const formatToolName = (name) => {
        return name
            .replace('mobile_', '')
            .replace(/_/g, ' ')
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'running': return 'bg-blue-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    const getStatusBorder = (status) => {
        switch (status) {
            case 'completed': return 'border-green-500 dark:border-green-400';
            case 'running': return 'border-blue-500 dark:border-blue-400';
            case 'error': return 'border-red-500 dark:border-red-400';
            default: return 'border-gray-300 dark:border-gray-600';
        }
    };

    return (
        <div className={`px-3 py-2.5 rounded-lg border-2 shadow-sm min-w-[180px] max-w-[220px] transition-all ${
            selected
                ? `${getStatusBorder(data.status)} bg-white dark:bg-gray-800 shadow-md`
                : `${getStatusBorder(data.status)} bg-white dark:bg-gray-800`
        }`}>
            <div className="flex items-center space-x-2 mb-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(data.status)} ${data.status === 'running' ? 'animate-pulse' : ''}`}></div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white truncate flex-1">
                    {formatToolName(data.label)}
                </div>
            </div>
            {data.description && (
                <div className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2 leading-tight">
                    {data.description}
                </div>
            )}
            {data.duration && (
                <div className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">
                    {data.duration}
                </div>
            )}
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

export default function FlowViewer({
    toolCalls = [],
    tasks = [],
    nodes: initialNodesProp = null,
    edges: initialEdgesProp = null,
    isOpen,
    onClose,
    autoShow = false,
    workflowId = null,
    onWorkflowSaved = null,
    workflowName = null,
} = {}) {
    const { theme } = useTheme();
    const [isHovered, setIsHovered] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isInteracting, setIsInteracting] = useState(false);
    const [position, setPosition] = useState({ x: null, y: null });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', 'error'
    const dialogRef = useRef(null);
    const reactFlowWrapper = useRef(null);
    const saveTimeoutRef = useRef(null);
    const lastSavedNodesRef = useRef(null);
    const lastSavedEdgesRef = useRef(null);

    // Convert tool calls to nodes and edges - Enhanced với thông tin từ agent
    const { nodes: toolNodes, edges: toolEdges } = useMemo(() => {
        if (toolCalls && toolCalls.length > 0) {
            const nodes = toolCalls.map((toolCall, index) => {
                const toolName = toolCall.function?.name || toolCall.name || 'Unknown';
                const toolId = toolCall.id || `tool-${index}`;
                const status = toolCall.status || (toolCall.result ? 'completed' : toolCall.error ? 'error' : 'running');

                // Parse arguments để hiển thị thông tin hữu ích
                let description = '';
                try {
                    const args = typeof toolCall.function?.arguments === 'string'
                        ? JSON.parse(toolCall.function.arguments)
                        : toolCall.function?.arguments || toolCall.arguments || {};

                    // Extract thông tin quan trọng từ arguments
                    if (args.device) description = `Device: ${args.device}`;
                    else if (args.x !== undefined && args.y !== undefined) description = `Click: (${args.x}, ${args.y})`;
                    else if (args.text) description = `Text: ${args.text.substring(0, 30)}...`;
                    else if (args.direction) description = `Swipe: ${args.direction}`;
                    else if (args.url) description = `URL: ${args.url.substring(0, 30)}...`;
                    else if (Object.keys(args).length > 0) {
                        description = Object.entries(args).slice(0, 2).map(([k, v]) => `${k}: ${String(v).substring(0, 15)}`).join(', ');
                    }
                } catch (e) {
                    description = '';
                }

                // Format duration
                const duration = toolCall.duration || toolCall.execution_time;
                const formatDuration = duration ? (duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`) : null;

                // Check if this node already exists (preserve position from user drag)
                const preservedPosition = nodesPositionMapRef.current.get(toolId);

                // Layout nodes in a horizontal flow (only if no existing position)
                const x = preservedPosition?.x ?? (index * 200);
                const y = preservedPosition?.y ?? 0;

                return {
                    id: toolId,
                    type: 'custom',
                    position: { x, y },
                    data: {
                        label: toolName,
                        description: description,
                        status: status,
                        duration: formatDuration,
                        toolCall: toolCall,
                    },
                };
            });

            // Create edges between ALL consecutive nodes (sequential flow)
            const edges = [];
            for (let i = 0; i < nodes.length - 1; i++) {
                const sourceNode = nodes[i];
                const targetNode = nodes[i + 1];
                const sourceStatus = sourceNode.data?.status;

                edges.push({
                    id: `e-${sourceNode.id}-${targetNode.id}`,
                    source: sourceNode.id,
                    target: targetNode.id,
                    type: 'smoothstep',
                    animated: sourceStatus === 'running',
                    style: {
                        stroke: sourceStatus === 'completed' ? '#10b981' :
                                sourceStatus === 'running' ? '#3b82f6' :
                                sourceStatus === 'error' ? '#ef4444' : '#9ca3af',
                        strokeWidth: 2.5,
                    },
                    markerEnd: {
                        type: 'arrowclosed',
                        color: sourceStatus === 'completed' ? '#10b981' :
                               sourceStatus === 'running' ? '#3b82f6' :
                               sourceStatus === 'error' ? '#ef4444' : '#9ca3af',
                    },
                });
            }

            return { nodes, edges };
        }
        return { nodes: [], edges: [] };
    }, [toolCalls]);

    // Convert tasks to nodes and edges
    const { nodes: taskNodes, edges: taskEdges } = useMemo(() => {
        if (tasks && tasks.length > 0) {
            const nodes = tasks.map((task, index) => {
                const taskId = `task-${index}`;
                const isCompleted = task.completed || false;
                const isActive = task.active || false;

                // Layout nodes in a horizontal flow
                const x = index * 200;
                const y = 0;

                return {
                    id: taskId,
                    type: 'custom',
                    position: { x, y },
                    data: {
                        label: task.description || task.action || `Task ${index + 1}`,
                        description: task.details || '',
                        status: isActive ? 'running' : (isCompleted ? 'completed' : 'pending'),
                    },
                };
            });

            const edges = [];
            for (let i = 0; i < nodes.length - 1; i++) {
                const sourceStatus = nodes[i].data?.status;
                edges.push({
                    id: `task-e${i}-${i + 1}`,
                    source: nodes[i].id,
                    target: nodes[i + 1].id,
                    type: 'smoothstep',
                    animated: sourceStatus === 'running',
                    style: {
                        stroke: sourceStatus === 'completed' ? '#10b981' :
                                sourceStatus === 'running' ? '#3b82f6' : '#9ca3af',
                        strokeWidth: 2.5,
                    },
                    markerEnd: {
                        type: 'arrowclosed',
                        color: sourceStatus === 'completed' ? '#10b981' :
                               sourceStatus === 'running' ? '#3b82f6' : '#9ca3af',
                    },
                });
            }

            return { nodes, edges };
        }
        return { nodes: [], edges: [] };
    }, [tasks]);

    // Use provided nodes/edges if available, otherwise use tool calls or tasks
    const initialNodes = initialNodesProp || (toolNodes.length > 0 ? toolNodes : taskNodes);
    const initialEdges = initialEdgesProp || (toolEdges.length > 0 ? toolEdges : taskEdges);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Track if nodes have been manually positioned (dragged)
    const nodesPositionMapRef = useRef(new Map());

    // Update nodes and edges when data changes - PRESERVE POSITIONS
    useEffect(() => {
        // Save current node positions before updating
        setNodes(currentNodes => {
            // Store current positions in ref
            currentNodes.forEach(node => {
                if (node.position) {
                    nodesPositionMapRef.current.set(node.id, node.position);
                }
            });

            // Check if nodes actually changed (by ID and count)
            const currentIds = new Set(currentNodes.map(n => n.id));
            const newIds = new Set(initialNodes.map(n => n.id));
            const idsChanged = currentIds.size !== newIds.size ||
                              [...currentIds].some(id => !newIds.has(id)) ||
                              [...newIds].some(id => !currentIds.has(id));

            // Only update if nodes changed
            if (!idsChanged && currentNodes.length === initialNodes.length) {
                // Nodes are the same, just update data (status, etc.) but keep positions
                return currentNodes.map(currentNode => {
                    const newNode = initialNodes.find(n => n.id === currentNode.id);
                    if (newNode) {
                        return {
                            ...newNode,
                            position: currentNode.position, // Keep current position
                        };
                    }
                    return currentNode;
                });
            }

            // Nodes changed - merge with preserved positions
            return initialNodes.map(newNode => {
                const preservedPosition = nodesPositionMapRef.current.get(newNode.id);
                if (preservedPosition) {
                    return {
                        ...newNode,
                        position: preservedPosition,
                    };
                }
                return newNode;
            });
        });

        // Always update edges from initial (edges should be recreated based on tool calls)
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    // Auto-save workflow when nodes/edges change (with debounce)
    const saveWorkflow = useCallback(async (nodesToSave, edgesToSave, isManual = false) => {
        // Skip if no workflow ID and not manual save
        if (!workflowId && !isManual) return;

        // Check if nodes/edges actually changed
        const currentNodesStr = JSON.stringify(nodesToSave);
        const currentEdgesStr = JSON.stringify(edgesToSave);

        if (!isManual &&
            currentNodesStr === lastSavedNodesRef.current &&
            currentEdgesStr === lastSavedEdgesRef.current) {
            return; // No changes
        }

        setIsSaving(true);
        setSaveStatus('saving');

        try {
            const payload = {
                nodes: nodesToSave,
                edges: edgesToSave,
                tool_calls: toolCalls,
                tasks: tasks,
            };

            if (workflowId) {
                // Update existing workflow
                const response = await axios.put(route('workflows.update', workflowId), payload);
                if (response.data.success) {
                    setSaveStatus('saved');
                    lastSavedNodesRef.current = currentNodesStr;
                    lastSavedEdgesRef.current = currentEdgesStr;
                    if (onWorkflowSaved) {
                        onWorkflowSaved(response.data.workflow);
                    }
                    // Clear status after 2 seconds
                    setTimeout(() => setSaveStatus(null), 2000);
                }
            } else if (isManual) {
                // Create new workflow (manual save)
                const name = workflowName || prompt('Nhập tên workflow:') || `Workflow ${new Date().toLocaleString()}`;
                if (!name) {
                    setIsSaving(false);
                    setSaveStatus(null);
                    return;
                }

                const response = await axios.post(route('workflows.store'), {
                    name: name,
                    description: `Workflow được tạo từ AI chat - ${new Date().toLocaleString('vi-VN')}`,
                    ...payload,
                    category: 'ai-generated',
                });

                if (response.data.success) {
                    setSaveStatus('saved');
                    lastSavedNodesRef.current = currentNodesStr;
                    lastSavedEdgesRef.current = currentEdgesStr;
                    if (onWorkflowSaved) {
                        onWorkflowSaved(response.data.workflow);
                    }
                    setTimeout(() => setSaveStatus(null), 2000);
                }
            }
        } catch (error) {
            console.error('Error saving workflow:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        } finally {
            setIsSaving(false);
        }
    }, [workflowId, toolCalls, tasks, workflowName, onWorkflowSaved]);

    // Debounced auto-save when nodes/edges change
    useEffect(() => {
        if (!workflowId) return; // Only auto-save if workflow exists

        // Clear previous timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout for auto-save (1 second debounce)
        saveTimeoutRef.current = setTimeout(() => {
            saveWorkflow(nodes, edges, false);
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [nodes, edges, workflowId, saveWorkflow]);

    // Manual save handler
    const handleManualSave = useCallback(() => {
        saveWorkflow(nodes, edges, true);
    }, [nodes, edges, saveWorkflow]);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    // Drag functionality
    const handleMouseDown = useCallback((e) => {
        if (!autoShow || !dialogRef.current) return;
        const rect = dialogRef.current.getBoundingClientRect();
        setDragStart({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setIsDragging(true);
    }, [autoShow]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !autoShow) return;
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // Constrain to viewport
        const maxX = window.innerWidth - (isExpanded ? 800 : 500);
        const maxY = window.innerHeight - (isExpanded ? 600 : 400);

        setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
        });
    }, [isDragging, dragStart, autoShow, isExpanded]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Auto-expand on hover - với delay để tránh flicker
    useEffect(() => {
        if (!autoShow) return;

        let expandTimer;
        let collapseTimer;

        if (isHovered && !isExpanded) {
            expandTimer = setTimeout(() => {
                setIsExpanded(true);
            }, 200);
        } else if (!isHovered && isExpanded && !isInteracting && !isDragging) {
            // Chỉ collapse khi không đang tương tác
            collapseTimer = setTimeout(() => {
                setIsExpanded(false);
            }, 1000);
        }

        return () => {
            if (expandTimer) clearTimeout(expandTimer);
            if (collapseTimer) clearTimeout(collapseTimer);
        };
    }, [isHovered, autoShow, isExpanded, isInteracting, isDragging]);

    // Determine if should show (autoShow mode or manual open)
    const shouldShow = autoShow ? (toolNodes.length > 0 || taskNodes.length > 0) : isOpen;

    if (!shouldShow) return null;

    const hasData = toolNodes.length > 0 || taskNodes.length > 0;
    if (!hasData) return null;

    const dialogWidth = autoShow ? (isExpanded ? 'w-[800px]' : 'w-[500px]') : 'w-full max-w-6xl';
    const dialogHeight = autoShow ? (isExpanded ? 'h-[600px]' : 'h-[400px]') : 'h-[80vh]';
    const dialogPosition = autoShow
        ? (position.x !== null && position.y !== null
            ? { left: `${position.x}px`, top: `${position.y}px`, bottom: 'auto', right: 'auto' }
            : { bottom: '1rem', right: '1rem', left: 'auto', top: 'auto' })
        : {};

    return (
        <div
            className={`fixed ${autoShow ? '' : 'inset-0 flex items-center justify-center'} z-50 ${autoShow ? '' : 'bg-gray-900/50 dark:bg-gray-900/80 p-4'}`}
            style={autoShow ? dialogPosition : {}}
        >
            <div
                ref={dialogRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
                    dialogWidth
                } ${dialogHeight} ${
                    isDragging ? 'cursor-grabbing' : (autoShow ? 'cursor-grab' : '')
                }`}
                style={autoShow ? {
                    ...dialogPosition,
                    transition: isDragging ? 'none' : 'all 0.3s ease'
                } : {}}
            >
                {/* Header - Draggable handle */}
                <div
                    onMouseDown={handleMouseDown}
                    className={`p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between ${
                        autoShow ? 'cursor-grab active:cursor-grabbing' : ''
                    }`}
                >
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Workflow Flow
                        </h2>
                        {nodes.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({nodes.length} {nodes.length === 1 ? 'step' : 'steps'})
                            </span>
                        )}
                        {autoShow && isExpanded && (
                            <span className="text-xs text-blue-500 dark:text-blue-400 ml-2">
                                • Expanded
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {/* Save Status Indicator */}
                        {saveStatus && (
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                                saveStatus === 'saving'
                                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                    : saveStatus === 'saved'
                                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                                    : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                            }`}>
                                {saveStatus === 'saving' && (
                                    <>
                                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Đang lưu...</span>
                                    </>
                                )}
                                {saveStatus === 'saved' && (
                                    <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Đã lưu</span>
                                    </>
                                )}
                                {saveStatus === 'error' && (
                                    <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        <span>Lỗi</span>
                                    </>
                                )}
                            </div>
                        )}
                        {/* Save Button */}
                        <button
                            onClick={handleManualSave}
                            disabled={isSaving}
                            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={workflowId ? "Lưu workflow" : "Lưu workflow mới"}
                        >
                            {isSaving ? (
                                <>
                                    <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Đang lưu...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    <span>Lưu</span>
                                </>
                            )}
                        </button>
                        {autoShow && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                title={isExpanded ? "Thu nhỏ" : "Phóng to"}
                            >
                                {isExpanded ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                )}
                            </button>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Flow Canvas - Interactive */}
                <div
                    className="flex-1 relative min-h-0"
                    ref={reactFlowWrapper}
                    onMouseEnter={() => setIsInteracting(true)}
                    onMouseLeave={() => setIsInteracting(false)}
                >
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={(changes) => {
                            // Handle position changes and preserve them
                            changes.forEach(change => {
                                if (change.type === 'position' && change.position && change.id) {
                                    nodesPositionMapRef.current.set(change.id, change.position);
                                }
                            });
                            onNodesChange(changes);
                        }}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.2, maxZoom: isExpanded ? 2 : 1.5 }}
                        className={`${theme === 'dark' ? 'dark' : ''}`}
                        style={{ background: theme === 'dark' ? '#111827' : '#f9fafb' }}
                        minZoom={0.2}
                        maxZoom={3}
                        nodesDraggable={true}
                        nodesConnectable={false}
                        elementsSelectable={true}
                        panOnDrag={true}
                        zoomOnScroll={true}
                        zoomOnPinch={true}
                        panOnScroll={false}
                        onNodeDragStart={() => setIsInteracting(true)}
                        onNodeDragStop={(event, node) => {
                            // Save node position when drag stops
                            if (node && node.position) {
                                nodesPositionMapRef.current.set(node.id, node.position);
                            }
                            setTimeout(() => setIsInteracting(false), 500);
                        }}
                    >
                        <Background
                            color={theme === 'dark' ? '#374151' : '#e5e7eb'}
                            gap={12}
                            size={1}
                        />
                        {/* Always show controls when expanded or not in autoShow mode */}
                        {(isExpanded || !autoShow) && (
                            <>
                                <Controls
                                    className={`${theme === 'dark' ? 'dark' : ''}`}
                                    style={{
                                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
                                    }}
                                />
                                <MiniMap
                                    className={`${theme === 'dark' ? 'dark' : ''}`}
                                    style={{
                                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
                                    }}
                                    nodeColor={(node) => {
                                        if (node.data?.status === 'completed') return '#10b981';
                                        if (node.data?.status === 'running') return '#3b82f6';
                                        if (node.data?.status === 'error') return '#ef4444';
                                        return theme === 'dark' ? '#6b7280' : '#9ca3af';
                                    }}
                                    maskColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.1)'}
                                />
                            </>
                        )}
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}

