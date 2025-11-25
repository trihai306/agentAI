import { useState, useEffect } from 'react';
import axios from 'axios';
import ConfirmDialog from '../Admin/ConfirmDialog';
import useConfirmDialog from '../../Hooks/useConfirmDialog';
import { toast } from '../../Utils/toast';

const AGENT_BRIDGE_URL = 'http://127.0.0.1:3001';

export default function ScriptsPanel({ isOpen, onClose, currentDeviceId, onScriptPlay }) {
    const [scripts, setScripts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [playingScript, setPlayingScript] = useState(null);
    const [playbackStatus, setPlaybackStatus] = useState(null);
    const { confirmDialog, hideDialog, dialogProps } = useConfirmDialog();

    useEffect(() => {
        if (isOpen) {
            loadScripts();
        }
    }, [isOpen]);

    const loadScripts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${AGENT_BRIDGE_URL}/api/scripts`);
            setScripts(response.data.scripts || []);
        } catch (error) {
            console.error('Error loading scripts:', error);
            toast.error('Lỗi khi tải danh sách scripts: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handlePlayScript = async (script) => {
        if (!currentDeviceId) {
            toast.warning('Vui lòng chọn thiết bị trước khi chạy script');
            return;
        }

        confirmDialog({
            title: 'Chạy script',
            message: `Bạn có chắc chắn muốn chạy lại script "${script.name}"?`,
            variant: 'info',
            confirmLabel: 'Chạy',
            cancelLabel: 'Hủy',
            onConfirm: async () => {

        setPlayingScript(script.filename);
        setPlaybackStatus({ status: 'playing', message: 'Đang chạy script...' });

        try {
            const response = await axios.post(`${AGENT_BRIDGE_URL}/api/scripts/${script.filename}/play`, {
                device_id: currentDeviceId,
                delayBetweenSteps: 500,
                stopOnError: false,
                skipScreenshots: false,
                skipElementListing: false
            });

            const playback = response.data.playback;
            setPlaybackStatus({
                status: playback.success ? 'success' : 'error',
                message: playback.success 
                    ? `Script đã chạy thành công! (${playback.totalSteps} bước, ${playback.duration}ms)`
                    : `Script gặp lỗi: ${playback.errors.length} lỗi`,
                playback: playback
            });

                    if (playback.success) {
                        toast.success(`Script đã chạy thành công! (${playback.totalSteps} bước)`);
                    } else {
                        toast.error(`Script gặp lỗi: ${playback.errors.length} lỗi`);
                    }

            // Callback để notify parent component
            if (onScriptPlay) {
                onScriptPlay(script, playback);
            }

            // Clear status after 5 seconds
            setTimeout(() => {
                setPlaybackStatus(null);
            }, 5000);
        } catch (error) {
            console.error('Error playing script:', error);
            setPlaybackStatus({
                status: 'error',
                message: 'Lỗi khi chạy script: ' + (error.response?.data?.error || error.message)
            });
                    toast.error('Lỗi khi chạy script: ' + (error.response?.data?.error || error.message));
        } finally {
            setPlayingScript(null);
        }
            },
        });
    };

    const handleDeleteScript = async (script, e) => {
        e.stopPropagation();
        confirmDialog({
            title: 'Xóa script',
            message: `Bạn có chắc chắn muốn xóa script "${script.name}"?`,
            description: 'Hành động này không thể hoàn tác.',
            variant: 'danger',
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            onConfirm: async () => {
        try {
            await axios.delete(`${AGENT_BRIDGE_URL}/api/scripts/${script.filename}`);
                    toast.success('Đã xóa script thành công');
            // Reload scripts
            loadScripts();
        } catch (error) {
            console.error('Error deleting script:', error);
                    toast.error('Lỗi khi xóa script: ' + (error.response?.data?.error || error.message));
        }
            },
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div 
                className="bg-[#202123] rounded-lg shadow-xl w-full max-w-4xl mx-4 border border-gray-700 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-700 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Scripts Library</h2>
                        <p className="text-sm text-gray-400 mt-1">Quản lý và chạy lại các kịch bản đã lưu</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={loadScripts}
                            className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
                            title="Refresh"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Playback Status */}
                {playbackStatus && (
                    <div className={`mx-6 mt-4 p-3 rounded-lg border ${
                        playbackStatus.status === 'success' 
                            ? 'bg-green-500/10 border-green-500/30 text-green-300'
                            : playbackStatus.status === 'error'
                            ? 'bg-red-500/10 border-red-500/30 text-red-300'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    }`}>
                        <div className="flex items-center space-x-2">
                            {playbackStatus.status === 'playing' && (
                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            )}
                            {playbackStatus.status === 'success' && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {playbackStatus.status === 'error' && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                            <span className="text-sm font-medium">{playbackStatus.message}</span>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-[#10a37f] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : scripts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">Chưa có script nào</h3>
                            <p className="text-gray-500 max-w-md">
                                Các kịch bản sẽ tự động được lưu lại sau mỗi lần chat với AI. Hãy thử chat với AI để tạo script đầu tiên!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {scripts.map((script) => (
                                <div
                                    key={script.filename}
                                    className="bg-[#343541] border border-gray-700 rounded-lg p-4 hover:border-[#10a37f]/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <svg className="w-5 h-5 text-[#10a37f] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <h3 className="text-base font-semibold text-white truncate" title={script.name}>
                                                    {script.name}
                                                </h3>
                                            </div>
                                            {script.metadata?.description && (
                                                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                                                    {script.metadata.description}
                                                </p>
                                            )}
                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    <span>{script.total_steps || 0} bước</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>{formatDate(script.created_at)}</span>
                                                </div>
                                                {script.metadata?.device_id && (
                                                    <div className="flex items-center space-x-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="truncate max-w-[100px]" title={script.metadata.device_id}>
                                                            {script.metadata.device_id.substring(0, 12)}...
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4 shrink-0">
                                            <button
                                                onClick={() => handlePlayScript(script)}
                                                disabled={playingScript === script.filename || !currentDeviceId}
                                                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                                                    playingScript === script.filename
                                                        ? 'bg-blue-500/50 text-blue-300 cursor-not-allowed'
                                                        : !currentDeviceId
                                                        ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                                                        : 'bg-[#10a37f] hover:bg-[#0d8f6e] text-white'
                                                }`}
                                                title={!currentDeviceId ? 'Vui lòng chọn thiết bị trước' : 'Chạy lại script'}
                                            >
                                                {playingScript === script.filename ? (
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                                                        <span>Đang chạy...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>Chạy lại</span>
                                                    </div>
                                                )}
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteScript(script, e)}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Xóa script"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogProps} />
        </div>
    );
}

