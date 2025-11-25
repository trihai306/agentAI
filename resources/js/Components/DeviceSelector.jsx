import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function DeviceSelector({
    isOpen,
    onClose,
    onSelectDevice,
    currentDeviceId,
    agentBridgeUrl = 'http://127.0.0.1:3001'
}) {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadDevices = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${agentBridgeUrl}/api/devices`);
            const deviceList = response.data.devices || [];

            // Filter chỉ lấy devices có status 'device' (connected)
            const connectedDevices = deviceList.filter(d => d.status === 'device');
            setDevices(connectedDevices);
        } catch (err) {
            console.error('[DeviceSelector] Error loading devices:', err);
            setError('Không thể kết nối đến Agent Bridge. Vui lòng kiểm tra lại.');
            setDevices([]);
        } finally {
            setLoading(false);
        }
    };

    const refreshDevices = async () => {
        try {
            setRefreshing(true);
            setError(null);
            const response = await axios.get(`${agentBridgeUrl}/api/devices`);
            const deviceList = response.data.devices || [];
            const connectedDevices = deviceList.filter(d => d.status === 'device');
            setDevices(connectedDevices);
        } catch (err) {
            console.error('[DeviceSelector] Error refreshing devices:', err);
            setError('Không thể làm mới danh sách thiết bị.');
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadDevices();
        }
    }, [isOpen]);

    const handleSelectDevice = (device) => {
        if (device.status === 'device') {
            onSelectDevice(device.id || device.device);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#343541] rounded-lg shadow-2xl w-full max-w-md mx-4 border border-gray-700">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#10a37f] flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Chọn thiết bị</h2>
                            <p className="text-sm text-gray-400">Chọn thiết bị Android để bắt đầu chat</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-[#10a37f] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400">Đang tải danh sách thiết bị...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <div className="text-red-400 mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-red-400 mb-4">{error}</p>
                            <button
                                onClick={loadDevices}
                                className="px-4 py-2 bg-[#10a37f] hover:bg-[#0d8f6e] text-white rounded-lg transition-colors"
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : devices.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-400 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-300 mb-2">Không tìm thấy thiết bị nào</p>
                            <p className="text-sm text-gray-500 mb-4">
                                Vui lòng kết nối thiết bị Android qua ADB và bật USB Debugging
                            </p>
                            <button
                                onClick={refreshDevices}
                                disabled={refreshing}
                                className="px-4 py-2 bg-[#10a37f] hover:bg-[#0d8f6e] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {refreshing ? 'Đang làm mới...' : 'Làm mới'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-gray-400">
                                    {devices.length} thiết bị đã kết nối
                                </p>
                                <button
                                    onClick={refreshDevices}
                                    disabled={refreshing}
                                    className="text-sm text-[#10a37f] hover:text-[#0d8f6e] transition-colors disabled:opacity-50 flex items-center space-x-1"
                                >
                                    <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Làm mới</span>
                                </button>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {devices.map((device) => {
                                    const deviceId = device.id || device.device;
                                    const isSelected = currentDeviceId === deviceId;
                                    return (
                                        <button
                                            key={deviceId}
                                            onClick={() => handleSelectDevice(device)}
                                            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                                isSelected
                                                    ? 'border-[#10a37f] bg-[#10a37f]/10'
                                                    : 'border-gray-700 bg-[#2d2d30] hover:border-gray-600 hover:bg-[#3d3d40]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                        isSelected ? 'bg-[#10a37f]' : 'bg-gray-700'
                                                    }`}>
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className={`font-medium ${isSelected ? 'text-[#10a37f]' : 'text-white'}`}>
                                                            {device.name || deviceId}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {deviceId}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div className="text-[#10a37f]">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {devices.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-700 bg-[#2d2d30] rounded-b-lg">
                        <p className="text-xs text-gray-500 text-center">
                            Đảm bảo thiết bị đã bật USB Debugging và được kết nối qua ADB
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

