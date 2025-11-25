import React, { useEffect, useRef, useCallback } from 'react';

export default function PhoneStream({ streaming, screenshot, selectedDeviceInfo }) {
    const containerRef = useRef(null);
    const imgRef = useRef(null);
    const frameRequestRef = useRef(null);
    const lastUpdateTimeRef = useRef(0);

    // Detect image format from base64 data
    const getImageFormat = useCallback((base64Data) => {
        if (!base64Data) return 'image/png';
        // JPEG base64 typically starts with /9j/ (after decoding first few chars)
        // PNG base64 typically starts with iVBORw0KGgo
        // Check first few characters to determine format
        const start = base64Data.substring(0, 20);
        if (start.includes('/9j/') || base64Data.startsWith('/9j/')) {
            return 'image/jpeg';
        }
        // Default to PNG for compatibility
        return 'image/png';
    }, []);

    // Optimized image update using requestAnimationFrame for smooth rendering
    const updateImage = useCallback(() => {
        if (imgRef.current && screenshot) {
            const now = performance.now();
            // Throttle updates to max 60 FPS (16.67ms per frame)
            if (now - lastUpdateTimeRef.current >= 16) {
                const format = getImageFormat(screenshot);
                const dataUrl = `data:${format};base64,${screenshot}`;
                // Only update if source changed to avoid unnecessary re-renders
                if (imgRef.current.src !== dataUrl) {
                    imgRef.current.src = dataUrl;
                    lastUpdateTimeRef.current = now;
                }
            }
            // Schedule next frame
            frameRequestRef.current = requestAnimationFrame(updateImage);
        }
    }, [screenshot, getImageFormat]);

    useEffect(() => {
        if (streaming && screenshot) {
            // Start animation frame loop for smooth rendering
            frameRequestRef.current = requestAnimationFrame(updateImage);
            return () => {
                if (frameRequestRef.current) {
                    cancelAnimationFrame(frameRequestRef.current);
                }
            };
        }
    }, [streaming, screenshot, updateImage]);

    useEffect(() => {
        if (imgRef.current && containerRef.current && screenshot) {
            const img = imgRef.current;
            const container = containerRef.current;

            const resizeImage = () => {
                if (!img.complete) return; // Wait for image to load

                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                const phoneAspectRatio = 9 / 16; // Phone aspect ratio

                let width, height;
                if (containerWidth / containerHeight > phoneAspectRatio) {
                    height = Math.min(containerHeight * 0.9, containerHeight - 32);
                    width = height * phoneAspectRatio;
                } else {
                    width = Math.min(containerWidth * 0.9, containerWidth - 32);
                    height = width / phoneAspectRatio;
                }

                img.style.width = `${width}px`;
                img.style.height = `${height}px`;
            };

            // Wait for image to load before resizing
            if (img.complete) {
                resizeImage();
            } else {
                img.onload = resizeImage;
            }

            window.addEventListener('resize', resizeImage);

            return () => {
                window.removeEventListener('resize', resizeImage);
            };
        }
    }, [streaming, screenshot]);

    if (!streaming) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center animate-fadeIn">
                    <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-2xl border-4 border-gray-700">
                        <svg
                            className="w-16 h-16 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    {selectedDeviceInfo ? (
                        <>
                            <h3 className="text-xl font-semibold text-gray-300 mb-2">
                                {selectedDeviceInfo.name || selectedDeviceInfo.id}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                ID: {selectedDeviceInfo.id}
                            </p>
                            <p className="text-sm text-gray-500 max-w-sm">
                                Nhấn "Bắt đầu" để stream màn hình thiết bị này
                            </p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-xl font-semibold text-gray-300 mb-2">Chưa chọn thiết bị</h3>
                            <p className="text-sm text-gray-500 max-w-sm">
                                Chọn thiết bị từ danh sách ở trên và bắt đầu stream
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center p-2 sm:p-4">
            <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl sm:rounded-3xl blur-3xl transform scale-110"></div>
                {screenshot ? (
                    <img
                        ref={imgRef}
                        src={`data:${getImageFormat(screenshot)};base64,${screenshot}`}
                        alt="Phone screen"
                        className="relative rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-gray-700/50 bg-black backdrop-blur-sm"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                        }}
                        onLoad={() => console.log('Image loaded successfully')}
                        onError={(e) => {
                            console.error('Image load error:', e);
                            console.log('Screenshot data length:', screenshot?.length);
                            console.log('First 100 chars:', screenshot?.substring(0, 100));
                        }}
                    />
                ) : (
                    <div className="relative rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-gray-700/50 bg-black backdrop-blur-sm w-full max-w-[360px] aspect-[9/16] flex items-center justify-center">
                        <div className="text-center px-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center animate-pulse">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <div className="text-gray-400 text-xs sm:text-sm">Đang kết nối stream...</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

