import { useState, useRef, useEffect } from 'react';

export default function DraggablePhoneViewer({ isOpen, onClose }) {
    // Phone aspect ratio (9:16)
    const PHONE_ASPECT_RATIO = 9 / 16;
    const MIN_WIDTH = 250;
    const MAX_WIDTH = Math.min(600, window.innerWidth - 40);
    const DEFAULT_WIDTH = 320;
    const HEADER_HEIGHT = 50;

    const getInitialSize = () => ({
        width: DEFAULT_WIDTH,
        height: DEFAULT_WIDTH / PHONE_ASPECT_RATIO + HEADER_HEIGHT,
    });

    const getInitialPosition = () => ({
        x: Math.max(20, window.innerWidth - DEFAULT_WIDTH - 20),
        y: 80,
    });

    const [position, setPosition] = useState(getInitialPosition());
    const [size, setSize] = useState(getInitialSize());
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [isMinimized, setIsMinimized] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [showDeviceSelector, setShowDeviceSelector] = useState(false);
    const [devices, setDevices] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);
    const windowRef = useRef(null);
    const headerRef = useRef(null);
    const iframeRef = useRef(null);
    const deviceSelectRef = useRef(null);
    const resizeHandleRef = useRef(null);

    // Reset position and size when opening
    useEffect(() => {
        if (isOpen) {
            setPosition(getInitialPosition());
            setSize(getInitialSize());
        }
    }, [isOpen]);

    // Listen for messages from iframe
    useEffect(() => {
        if (!isOpen) return;

        const handleMessage = (event) => {
            if (event.data && event.data.type === 'devices_updated') {
                setDevices(event.data.devices || []);
            } else if (event.data && event.data.type === 'stream_started') {
                setIsStreaming(true);
                setSelectedDeviceId(event.data.device_id);
            } else if (event.data && event.data.type === 'stream_stopped') {
                setIsStreaming(false);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isOpen]);

    // Handle window resize
    useEffect(() => {
        if (!isOpen) return;

        const handleResize = () => {
            setPosition((prev) => ({
                x: Math.max(0, Math.min(prev.x, window.innerWidth - size.width)),
                y: Math.max(0, Math.min(prev.y, window.innerHeight - (isMinimized ? HEADER_HEIGHT : size.height))),
            }));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isOpen, isMinimized, size]);

    useEffect(() => {
        if (!isOpen) return;

        const handleMouseMove = (e) => {
            if (isDragging) {
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;

                // Constrain to viewport
                const maxX = window.innerWidth - size.width;
                const maxY = window.innerHeight - (isMinimized ? HEADER_HEIGHT : size.height);

                setPosition({
                    x: Math.max(0, Math.min(newX, maxX)),
                    y: Math.max(0, Math.min(newY, maxY)),
                });
            } else if (isResizing) {
                const deltaX = e.clientX - resizeStart.x;
                const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStart.width + deltaX));
                const newHeight = newWidth / PHONE_ASPECT_RATIO + HEADER_HEIGHT;

                setSize({
                    width: newWidth,
                    height: newHeight,
                });

                // Adjust position to keep window in viewport
                setPosition((prev) => ({
                    x: Math.min(prev.x, window.innerWidth - newWidth),
                    y: Math.min(prev.y, window.innerHeight - newHeight),
                }));
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none';
            document.body.style.cursor = isResizing ? 'nwse-resize' : 'move';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };
    }, [isDragging, isResizing, dragOffset, resizeStart, isMinimized, isOpen, size]);

    const handleMouseDown = (e) => {
        // Only allow dragging from header, not buttons
        if (e.target.closest('button')) {
            return;
        }

        const rect = headerRef.current?.getBoundingClientRect();
        if (rect) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    // Constrain position to viewport
    const constrainedPosition = {
        x: Math.max(0, Math.min(position.x, window.innerWidth - size.width)),
        y: Math.max(0, Math.min(position.y, window.innerHeight - (isMinimized ? HEADER_HEIGHT : size.height))),
    };

    const handleResizeStart = (e) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
        });
    };

    // Send command to iframe
    const sendCommand = (command, data) => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'command',
                command,
                data,
            }, '*');
        }
    };

    if (!isOpen) return null;

    return (
        <div
            ref={windowRef}
            className="fixed z-50 shadow-2xl rounded-lg border border-gray-700/50 bg-black overflow-hidden"
            style={{
                left: `${constrainedPosition.x}px`,
                top: `${constrainedPosition.y}px`,
                width: `${size.width}px`,
                height: isMinimized ? `${HEADER_HEIGHT}px` : `${size.height}px`,
                transition: (isDragging || isResizing) ? 'none' : 'height 0.3s ease, width 0.3s ease',
            }}
        >
            {/* Compact Header - Draggable */}
            <div
                ref={headerRef}
                className="px-2 py-1.5 flex items-center justify-between cursor-move bg-black/80 backdrop-blur-sm border-b border-gray-700/30 transition-colors select-none"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className="flex items-center space-x-1 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    </div>
                    <h2 className="text-xs font-medium text-gray-300 truncate">Phone</h2>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                    <button
                        onClick={() => {
                            setShowDeviceSelector(!showDeviceSelector);
                            // Request device list when opening selector
                            if (!showDeviceSelector && iframeRef.current?.contentWindow) {
                                iframeRef.current.contentWindow.postMessage({
                                    type: 'refresh_devices',
                                }, '*');
                            }
                        }}
                        className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                        title="Chọn thiết bị"
                    >
                        <svg
                            className="w-3.5 h-3.5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={() => setShowControls(!showControls)}
                        className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                        title="Controls"
                    >
                        <svg
                            className="w-3.5 h-3.5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                        title={isMinimized ? 'Maximize' : 'Minimize'}
                    >
                        <svg
                            className="w-3.5 h-3.5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {isMinimized ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 8h16M4 16h16"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 12H4"
                                />
                            )}
                        </svg>
                    </button>
                    <button
                        onClick={() => {
                            // Dừng stream khi đóng modal
                            if (isStreaming && iframeRef.current?.contentWindow) {
                                iframeRef.current.contentWindow.postMessage({
                                    type: 'stop_stream',
                                    deviceId: selectedDeviceId,
                                }, '*');
                            }
                            onClose();
                        }}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        title="Close"
                    >
                        <svg
                            className="w-3.5 h-3.5 text-gray-400 hover:text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Device Selector Panel */}
            {!isMinimized && showDeviceSelector && (
                <div className="absolute top-[50px] left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 z-20 p-2 space-y-2">
                    <div className="flex items-center gap-2">
                        <select
                            ref={deviceSelectRef}
                            id="compactDeviceSelect"
                            className="flex-1 px-2 py-1.5 bg-gray-800 text-white text-xs rounded border border-gray-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                            value={selectedDeviceId || ''}
                            onChange={(e) => {
                                const deviceId = e.target.value;
                                setSelectedDeviceId(deviceId);
                                if (iframeRef.current?.contentWindow) {
                                    iframeRef.current.contentWindow.postMessage({
                                        type: 'device_select',
                                        deviceId: deviceId,
                                    }, '*');

                                    // Tự động bắt đầu stream khi chọn device
                                    if (deviceId) {
                                        setTimeout(() => {
                                            iframeRef.current?.contentWindow.postMessage({
                                                type: 'start_stream',
                                                deviceId: deviceId,
                                            }, '*');
                                        }, 100);
                                    }
                                }
                            }}
                        >
                            <option value="">Chọn thiết bị...</option>
                            {devices.map((device) => (
                                <option key={device.id} value={device.id}>
                                    {device.name || device.id} {device.status ? `(${device.status})` : ''}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                if (iframeRef.current?.contentWindow) {
                                    iframeRef.current.contentWindow.postMessage({
                                        type: 'refresh_devices',
                                    }, '*');
                                }
                            }}
                            className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-600/50 transition-colors shrink-0"
                            title="Làm mới"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Phone Viewer Iframe - Compact Mode */}
            {!isMinimized && (
                <div className="relative w-full bg-black" style={{ height: `${size.height - HEADER_HEIGHT}px` }}>
                    <iframe
                        ref={iframeRef}
                        src="/phone-viewer.html?compact=true"
                        className="w-full h-full border-0"
                        title="Phone Viewer"
                        allow="camera; microphone"
                    />

                    {/* Resize Handle */}
                    <div
                        ref={resizeHandleRef}
                        onMouseDown={handleResizeStart}
                        className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize bg-gray-700/60 hover:bg-gray-600/80 transition-colors z-30"
                        style={{
                            clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
                        }}
                        title="Kéo để thay đổi kích thước"
                    />

                    {/* Floating Controls - Bottom Right Corner */}
                    {showControls && (
                        <div className="absolute bottom-2 right-2 flex flex-col gap-1.5 z-10">
                            <button
                                onClick={() => sendCommand('key', { key: 'HOME' })}
                                className="w-8 h-8 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center shadow-lg border border-gray-700/50 transition-all hover:scale-110"
                                title="Home"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </button>
                            <button
                                onClick={() => sendCommand('key', { key: 'BACK' })}
                                className="w-8 h-8 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center shadow-lg border border-gray-700/50 transition-all hover:scale-110"
                                title="Back"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <button
                                onClick={() => sendCommand('key', { key: 'MENU' })}
                                className="w-8 h-8 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center shadow-lg border border-gray-700/50 transition-all hover:scale-110"
                                title="Menu"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

