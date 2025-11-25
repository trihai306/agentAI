import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const AGENT_BRIDGE_URL = 'http://127.0.0.1:3001';
const AGENT_BRIDGE_WS_URL = 'ws://127.0.0.1:3002';
const CHECK_INTERVAL = 3000; // Check connection every 3 seconds

export function useLocalApp() {
    const [connected, setConnected] = useState(false);
    const [wsConnected, setWsConnected] = useState(false); // WebSocket connection status (independent of HTTP check)
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [screenshot, setScreenshot] = useState(null);
    const [streaming, setStreaming] = useState(false);
    const [mobileTools, setMobileTools] = useState([]);

    const wsRef = useRef(null);
    const screenshotIntervalRef = useRef(null);
    const checkIntervalRef = useRef(null);
    const hasLoadedDevicesRef = useRef(false); // Track if devices have been loaded

    // Load devices from Agent Bridge - gọi trực tiếp agent-bridge
    const loadDevices = useCallback(async () => {
        try {
            const response = await axios.get(`${AGENT_BRIDGE_URL}/api/devices`);
            setDevices(response.data.devices || []);
        } catch (error) {
            console.error('Error loading devices:', error);
            setDevices([]);
        }
    }, []);

    // Load mobile tools - gọi trực tiếp agent-bridge
    const loadMobileTools = useCallback(async () => {
        try {
            const response = await axios.get(`${AGENT_BRIDGE_URL}/api/mobile/tools`);
            setMobileTools(response.data.tools || []);
        } catch (error) {
            console.error('Error loading mobile tools:', error);
            setMobileTools([]);
        }
    }, []);

    // Stop screenshot streaming
    const stopScreenshotStream = useCallback(() => {
        setStreaming(false);

        if (screenshotIntervalRef.current) {
            clearInterval(screenshotIntervalRef.current);
            screenshotIntervalRef.current = null;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'stopScreenStream',
                deviceId: selectedDevice
            }));
        }
    }, [selectedDevice]);

    const disconnect = useCallback(() => {
        stopScreenshotStream();

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setConnected(false);
        setDevices([]);
        setSelectedDevice(null);
        setScreenshot(null);
        hasLoadedDevicesRef.current = false; // Reset flag on disconnect
    }, [stopScreenshotStream]);

    // Check if Agent Bridge is available - gọi trực tiếp agent-bridge
    const checkConnection = useCallback(async () => {
        try {
            const response = await axios.get(`${AGENT_BRIDGE_URL}/health`);
            const isConnected = response.data.status === 'ok';

            setConnected(prevConnected => {
                if (isConnected && !prevConnected) {
                    // Load devices and mobile tools only once when first connected
                    if (!hasLoadedDevicesRef.current) {
                        loadDevices();
                        loadMobileTools();
                        hasLoadedDevicesRef.current = true;
                    }
                    return true;
                } else if (!isConnected && prevConnected) {
                    hasLoadedDevicesRef.current = false; // Reset flag when disconnected
                    disconnect();
                    return false;
                }
                return prevConnected;
            });

            return isConnected;
        } catch (error) {
            setConnected(prevConnected => {
                if (prevConnected) {
                    hasLoadedDevicesRef.current = false; // Reset flag on error
                    disconnect();
                    return false;
                }
                return prevConnected;
            });
            return false;
        }
    }, [loadDevices, loadMobileTools, disconnect]);

    // Connect WebSocket
    const connectWebSocket = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        const ws = new WebSocket(AGENT_BRIDGE_WS_URL);

        ws.onopen = () => {
            console.log('Connected to Agent Bridge WebSocket');
            setWsConnected(true); // Update WebSocket connection status

            // Get session info from localStorage and register with server
            try {
                const sessionId = localStorage.getItem('ai_active_session_id');
                const deviceId = localStorage.getItem('selected_device_id');

                // Register session with WebSocket server
                if (sessionId || deviceId) {
                    ws.send(JSON.stringify({
                        type: 'register:session',
                        session_id: sessionId || null,
                        device_id: deviceId || null
                    }));
                    console.log('[WebSocket] Registered session:', { sessionId, deviceId });
                }
            } catch (error) {
                console.warn('[WebSocket] Error reading session from localStorage:', error);
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Handle message inline
                switch (data.type) {
                    case 'connection:established':
                        console.log('[WebSocket] Connection established:', data.message);
                        // Register session if we have one
                        try {
                            const sessionId = localStorage.getItem('ai_active_session_id');
                            const deviceId = localStorage.getItem('selected_device_id');
                            if (sessionId || deviceId) {
                                ws.send(JSON.stringify({
                                    type: 'register:session',
                                    session_id: sessionId || null,
                                    device_id: deviceId || null
                                }));
                            }
                        } catch (error) {
                            console.warn('[WebSocket] Error registering session:', error);
                        }
                        break;
                    case 'session:registered':
                        console.log('[WebSocket] Session registered successfully:', {
                            session_id: data.session_id,
                            device_id: data.device_id,
                            connected_at: data.connected_at
                        });
                        // Dispatch event for components to know session is connected
                        window.dispatchEvent(new CustomEvent('websocket:session:registered', {
                            detail: {
                                session_id: data.session_id,
                                device_id: data.device_id,
                                connected_at: data.connected_at
                            }
                        }));
                        break;
                    case 'devices':
                        setDevices(data.devices || []);
                        break;
                    case 'screen:updated':
                        // Screenshot stream from WebSocket (PNG base64)
                        if (data.deviceId && data.screenshot) {
                            // Stop HTTP polling if WebSocket is working
                            if (screenshotIntervalRef.current) {
                                clearInterval(screenshotIntervalRef.current);
                                screenshotIntervalRef.current = null;
                            }
                            setScreenshot(data.screenshot);
                        }
                        break;
                    case 'screen:video':
                        // Scrcpy video stream (H.264 chunks) - for future implementation
                        // Currently we'll use screenshot stream for compatibility
                        console.log('Received scrcpy video chunk (H.264 streaming not yet implemented in frontend)');
                        break;
                    case 'screen:streamStarted':
                        console.log(`✓ Stream started: ${data.method} at ${data.fps} FPS`);
                        // Stop HTTP polling if WebSocket stream started
                        if (screenshotIntervalRef.current) {
                            clearInterval(screenshotIntervalRef.current);
                            screenshotIntervalRef.current = null;
                        }
                        break;
                    case 'mobile:result':
                        // Mobile tool execution result
                        break;
                    case 'mcp:screenshot':
                        // Screenshot captured - update screenshot state (kept for compatibility)
                        if (data.deviceId && data.screenshot) {
                            setScreenshot(data.screenshot);
                            // Also dispatch event for components
                            window.dispatchEvent(new CustomEvent('mcp:screenshot', {
                                detail: {
                                    deviceId: data.deviceId,
                                    screenshot: data.screenshot,
                                    timestamp: data.timestamp
                                }
                            }));
                        }
                        break;
                    case 'mobile:screenshot':
                        // Screenshot from mobile automation - update immediately and dispatch event
                        if (data.deviceId && (data.screenshot || data.file_id)) {
                            // Update screenshot state if we have base64 data
                            if (data.screenshot) {
                                setScreenshot(data.screenshot);
                            }
                            // Dispatch event for Chat.jsx to handle
                            window.dispatchEvent(new CustomEvent('mobile:screenshot', {
                                detail: {
                                    deviceId: data.deviceId,
                                    screenshot: data.screenshot, // base64 data (if available)
                                    file_id: data.file_id, // OpenAI file_id (if uploaded)
                                    format: data.format || (data.file_id ? 'file_id' : 'base64'),
                                    timestamp: data.timestamp || Date.now()
                                }
                            }));
                        }
                        break;
                    case 'mobile:error':
                        console.error('Mobile tool error:', data.error);
                        break;
                    case 'ai:chat:started':
                        // Chat processing started
                        break;
                    case 'ai:tool:started':
                        // Tool execution started - emit event for components
                        console.log('[WebSocket] Received ai:tool:started:', data.tool);
                        window.dispatchEvent(new CustomEvent('tool:started', {
                            detail: {
                                tool: data.tool,
                                arguments: data.arguments,
                                toolCall: data.toolCall
                            }
                        }));
                        break;
                    case 'ai:tool:completed':
                        // Tool execution completed - emit event for components
                        console.log('[WebSocket] Received ai:tool:completed:', data.tool, data.success ? 'success' : 'error');
                        window.dispatchEvent(new CustomEvent('tool:completed', {
                            detail: {
                                tool: data.tool,
                                success: data.success,
                                result: data.result,
                                toolCall: data.toolCall
                            }
                        }));
                        break;
                    case 'ai:response:update':
                        // AI response update (realtime streaming)
                        window.dispatchEvent(new CustomEvent('ai:response:update', {
                            detail: {
                                content: data.content,
                                delta: data.delta, // Thêm delta để support streaming
                                tool_calls: data.tool_calls,
                                has_tool_calls: data.has_tool_calls,
                                isThinking: data.isThinking || false // Thêm isThinking flag
                            }
                        }));
                        break;
                    case 'ai:thinking:structured':
                        // Structured thinking before tool call
                        console.log('[WebSocket] Received ai:thinking:structured:', data.toolName);
                        window.dispatchEvent(new CustomEvent('thinking:structured', {
                            detail: {
                                thinking: data.thinking,
                                analysis: data.analysis,
                                reasoning: data.reasoning,
                                next_steps: data.next_steps,
                                toolName: data.toolName,
                                toolCallId: data.toolCallId
                            }
                        }));
                        break;
                    case 'ai:tool:analysis':
                        // Agent's analysis of tool result
                        console.log('[WebSocket] Received ai:tool:analysis:', data.toolName);
                        window.dispatchEvent(new CustomEvent('tool:analysis', {
                            detail: {
                                toolName: data.toolName,
                                toolCallId: data.toolCallId,
                                thinking: data.thinking,
                                analysis: data.analysis,
                                reasoning: data.reasoning,
                                next_steps: data.next_steps
                            }
                        }));
                        break;
                    case 'ai:chat:completed':
                        // Chat processing completed
                        window.dispatchEvent(new CustomEvent('chat:completed', {
                            detail: { has_tool_calls: data.has_tool_calls }
                        }));
                        break;
                    case 'ai:chat:error':
                        // Chat error
                        window.dispatchEvent(new CustomEvent('chat:error', {
                            detail: { error: data.error }
                        }));
                        break;
                    case 'ai:status:update':
                        // Real-time status update
                        window.dispatchEvent(new CustomEvent('ai:status:update', {
                            detail: {
                                status: data.status,
                                message: data.message,
                                tool: data.tool,
                                success: data.success,
                                iteration: data.iteration,
                                tool_calls_count: data.tool_calls_count
                            }
                        }));
                        break;
                    case 'ai:plan:update':
                        // Plan/task list update
                        console.log('[WebSocket] Received ai:plan:update');
                        window.dispatchEvent(new CustomEvent('ai:plan:update', {
                            detail: {
                                plan: data.plan,
                                nextAction: data.nextAction,
                                isComplete: data.isComplete,
                                summary: data.summary,
                                progress: data.progress
                            }
                        }));
                        break;
                    case 'ai:workflow:update':
                        // Workflow update with element information
                        console.log('[WebSocket] Received ai:workflow:update');
                        window.dispatchEvent(new CustomEvent('ai:workflow:update', {
                            detail: {
                                workflow: data.workflow,
                                nodes: data.nodes,
                                edges: data.edges,
                                tool_calls: data.tool_calls,
                                metadata: data.metadata,
                                name: data.name,
                                description: data.description
                            }
                        }));
                        break;
                    default:
                        console.log('Unknown WebSocket message type:', data.type);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('Disconnected from Agent Bridge WebSocket');
            setWsConnected(false); // Update WebSocket connection status
            // Try to reconnect after 3 seconds (always reconnect, don't check connected state)
            setTimeout(() => {
                // Only reconnect if we don't already have an active connection
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                    console.log('Attempting to reconnect WebSocket...');
                    connectWebSocket();
                }
            }, 3000);
        };

        wsRef.current = ws;
    }, []); // Remove connected dependency - WebSocket should connect independently


    // Start screenshot streaming
    const startScreenshotStream = useCallback((deviceId, useScrcpy = true) => {
        if (!deviceId) return;

        setSelectedDevice(deviceId);
        setStreaming(true);
        setScreenshot(null); // Reset screenshot

        // PRIORITY: Use WebSocket for real-time streaming (much faster than HTTP polling)
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('Starting WebSocket stream for device:', deviceId);
            wsRef.current.send(JSON.stringify({
                type: 'startScreenStream',
                deviceId: deviceId,
                useScrcpy: useScrcpy
            }));
        } else {
            // Fallback: Use HTTP polling if WebSocket not available - gọi trực tiếp agent-bridge
            console.log('WebSocket not available, using HTTP polling fallback');
            const pollScreenshot = async () => {
                try {
                    const response = await axios.get(`${AGENT_BRIDGE_URL}/api/devices/${deviceId}/screen`, {
                        responseType: 'blob'
                    });
                    // Convert blob to base64
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result;
                        setScreenshot(base64data);
                    };
                    reader.readAsDataURL(response.data);
                } catch (error) {
                    console.error('Error getting screenshot:', error);
                }
            };

            // Poll immediately and then every 16ms for 60 FPS (realtime)
            pollScreenshot();
            screenshotIntervalRef.current = setInterval(pollScreenshot, 16);
        }
    }, []);

    // Device control methods - gọi trực tiếp agent-bridge
    const click = useCallback(async (x, y) => {
        if (!selectedDevice) return false;
        try {
            const response = await axios.post(`${AGENT_BRIDGE_URL}/api/devices/${selectedDevice}/click`, { x, y });
            return response.data.success;
        } catch (error) {
            console.error('Error clicking:', error);
            return false;
        }
    }, [selectedDevice]);

    const swipe = useCallback(async (x1, y1, x2, y2, duration = 300) => {
        if (!selectedDevice) return false;
        try {
            const response = await axios.post(`${AGENT_BRIDGE_URL}/api/devices/${selectedDevice}/swipe`, {
                x1, y1, x2, y2, duration
            });
            return response.data.success;
        } catch (error) {
            console.error('Error swiping:', error);
            return false;
        }
    }, [selectedDevice]);

    const type = useCallback(async (text) => {
        if (!selectedDevice) return false;
        try {
            const response = await axios.post(`${AGENT_BRIDGE_URL}/api/devices/${selectedDevice}/type`, { text });
            return response.data.success;
        } catch (error) {
            console.error('Error typing:', error);
            return false;
        }
    }, [selectedDevice]);

    const pressKey = useCallback(async (key) => {
        if (!selectedDevice) return false;
        try {
            const response = await axios.post(`${AGENT_BRIDGE_URL}/api/devices/${selectedDevice}/key`, { key });
            return response.data.success;
        } catch (error) {
            console.error('Error pressing key:', error);
            return false;
        }
    }, [selectedDevice]);

    // Mobile tool execution - gọi trực tiếp agent-bridge
    const executeMobileTool = useCallback(async (tool, args = {}) => {
        try {
            const response = await axios.post(`${AGENT_BRIDGE_URL}/api/mobile/execute`, {
                tool,
                arguments: args
            });
            return response.data.result;
        } catch (error) {
            console.error('Error executing mobile tool:', error);
            throw error;
        }
    }, []);

    // Listen for session update requests from components
    useEffect(() => {
        const handleUpdateSession = (event) => {
            const { session_id, device_id } = event.detail || {};
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'register:session',
                    session_id: session_id || null,
                    device_id: device_id || null
                }));
                console.log('[WebSocket] Updated session registration:', { session_id, device_id });
            }
        };

        window.addEventListener('websocket:update:session', handleUpdateSession);

        return () => {
            window.removeEventListener('websocket:update:session', handleUpdateSession);
        };
    }, []);

    // Auto-check connection
    useEffect(() => {
        checkConnection();
        checkIntervalRef.current = setInterval(checkConnection, CHECK_INTERVAL);

        return () => {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, [checkConnection]);

    // Listen for custom events to send WebSocket messages
    useEffect(() => {
        const handleWebSocketSend = (event) => {
            if (wsRef.current?.readyState === WebSocket.OPEN && event.detail) {
                try {
                    wsRef.current.send(JSON.stringify(event.detail));
                    console.log('[WebSocket] Sent message:', event.detail.type);
                } catch (error) {
                    console.error('[WebSocket] Error sending message:', error);
                }
            } else {
                console.warn('[WebSocket] Cannot send message - WebSocket not connected');
            }
        };

        window.addEventListener('websocket:send', handleWebSocketSend);

        return () => {
            window.removeEventListener('websocket:send', handleWebSocketSend);
        };
    }, []);

    // Connect WebSocket immediately (don't wait for HTTP check)
    // WebSocket connection is independent of HTTP API availability
    useEffect(() => {
        // Always try to connect WebSocket, even if HTTP check hasn't completed yet
        // This ensures real-time events are received as soon as possible
        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [connectWebSocket]);

    return {
        connected,
        wsConnected, // Export WebSocket connection status
        devices,
        selectedDevice,
        screenshot,
        streaming,
        mobileTools,
        checkConnection,
        loadDevices,
        selectDevice: setSelectedDevice,
        startScreenshotStream,
        stopScreenshotStream,
        click,
        swipe,
        type,
        pressKey,
        executeMobileTool,
        disconnect
    };
}
