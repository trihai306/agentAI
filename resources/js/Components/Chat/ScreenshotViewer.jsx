import React, { useState, useEffect } from 'react';

/**
 * Enhanced Screenshot Viewer với zoom, pan, fullscreen
 */
export default function ScreenshotViewer({
    imageUrl,
    alt = 'Screenshot',
    metadata = null,
    className = ''
}) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleZoomReset = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };
    const handleZoomFit = () => setZoom(1);

    const handleMouseDown = (e) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `screenshot-${Date.now()}.png`;
        link.click();
    };

    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
        }
    };

    const thumbnailView = (
        <div className={`relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 ${className}`}>
            <img
                src={imageUrl}
                alt={alt}
                className="w-full h-auto cursor-zoom-in"
                onClick={() => setIsFullscreen(true)}
                onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                }}
            />
            <div className="hidden text-gray-500 dark:text-gray-400 text-sm p-4 text-center">
                Failed to load image
            </div>
            {metadata && (
                <div className="absolute bottom-0 left-0 right-0 bg-gray-900/80 dark:bg-black/70 text-white text-xs p-2">
                    {metadata.deviceId && <div>Device: {metadata.deviceId}</div>}
                    {metadata.timestamp && <div>Time: {new Date(metadata.timestamp).toLocaleString()}</div>}
                </div>
            )}
        </div>
    );

    const fullscreenView = (
        <div
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            {/* Header with controls */}
            <div className="flex items-center justify-between p-4 bg-gray-900/95 dark:bg-black/95 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{alt}</span>
                    {metadata && (
                        <span className="text-gray-400 text-sm">
                            {metadata.deviceId && `• ${metadata.deviceId}`}
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    {/* Zoom controls */}
                    <div className="flex items-center space-x-1 bg-gray-800 dark:bg-gray-900 rounded-lg p-1">
                        <button
                            onClick={handleZoomOut}
                            className="p-2 text-white hover:bg-gray-700 dark:hover:bg-gray-800 rounded transition-colors"
                            title="Zoom out"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                            </svg>
                        </button>
                        <span className="px-2 text-white text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                        <button
                            onClick={handleZoomIn}
                            className="p-2 text-white hover:bg-gray-700 dark:hover:bg-gray-800 rounded transition-colors"
                            title="Zoom in"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                            </svg>
                        </button>
                        <button
                            onClick={handleZoomReset}
                            className="p-2 text-white hover:bg-gray-700 dark:hover:bg-gray-800 rounded transition-colors"
                            title="Reset zoom"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="p-2 text-white hover:bg-gray-700 dark:hover:bg-gray-800 rounded transition-colors"
                        title="Download"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="p-2 text-white hover:bg-gray-700 dark:hover:bg-gray-800 rounded transition-colors"
                        title="Close (ESC)"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Image container */}
            <div className="flex-1 overflow-hidden relative">
                <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                    }}
                    onMouseDown={handleMouseDown}
                >
                    <img
                        src={imageUrl}
                        alt={alt}
                        className="max-w-full max-h-full object-contain select-none"
                        draggable={false}
                    />
                </div>
            </div>

            {/* Footer with metadata */}
            {metadata && (
                <div className="p-4 bg-gray-900/95 dark:bg-black/95 border-t border-gray-700 text-white text-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            {metadata.deviceId && <div>Device: {metadata.deviceId}</div>}
                            {metadata.timestamp && <div>Time: {new Date(metadata.timestamp).toLocaleString()}</div>}
                        </div>
                        <div className="text-gray-400 text-xs">
                            Use mouse wheel + Ctrl to zoom, drag to pan
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // ESC key handler
    useEffect(() => {
        if (!isFullscreen) return;
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isFullscreen]);

    return (
        <>
            {thumbnailView}
            {isFullscreen && fullscreenView}
        </>
    );
}

