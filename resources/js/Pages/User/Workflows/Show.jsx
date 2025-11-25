import { Head, router, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import UserLayout from '../../../Layouts/UserLayout';
import FlowViewer from '../../../Components/Chat/FlowViewer';
import ConfirmDialog from '../../../Components/Admin/ConfirmDialog';
import useConfirmDialog from '../../../Hooks/useConfirmDialog';
import route from '../../../Utils/route';
import { toast } from '../../../Utils/toast';
import axios from 'axios';

export default function UserWorkflowShow({ workflow }) {
    const { flash } = usePage().props;
    const [showFlowViewer, setShowFlowViewer] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(workflow.name);
    const [editDescription, setEditDescription] = useState(workflow.description || '');
    const [editCategory, setEditCategory] = useState(workflow.category || '');
    const [saving, setSaving] = useState(false);
    const { confirmDialog, hideDialog, dialogProps } = useConfirmDialog();

    // Show toast notifications from flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await axios.put(route('workflows.update', workflow.id), {
                name: editName,
                description: editDescription,
                category: editCategory,
            });
            if (response.data.success) {
                setIsEditing(false);
                toast.success('Đã cập nhật workflow thành công');
                router.reload();
            } else {
                toast.error('Lỗi khi lưu workflow');
            }
        } catch (error) {
            console.error('Error saving workflow:', error);
            toast.error('Lỗi khi lưu workflow');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        confirmDialog({
            title: 'Xóa workflow',
            message: `Bạn có chắc chắn muốn xóa workflow "${workflow.name}"?`,
            description: 'Hành động này không thể hoàn tác.',
            variant: 'danger',
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            onConfirm: () => {
                router.delete(route('workflows.destroy', workflow.id), {
                    onSuccess: () => {
                        toast.success('Đã xóa workflow thành công');
                    },
                    onError: () => {
                        toast.error('Lỗi khi xóa workflow');
                    },
                });
            },
        });
    };

    const handleDuplicate = async () => {
        try {
            const response = await axios.post(route('workflows.duplicate', workflow.id));
            if (response.data.success) {
                toast.success('Đã sao chép workflow thành công');
                router.visit(route('workflows.index'));
            } else {
                toast.error('Lỗi khi sao chép workflow');
            }
        } catch (error) {
            console.error('Error duplicating workflow:', error);
            toast.error('Lỗi khi sao chép workflow');
        }
    };

    // Convert workflow nodes/edges to ReactFlow format
    const nodes = workflow.workflow_nodes?.map(node => ({
        id: node.node_id,
        type: node.type || 'custom',
        position: {
            x: parseFloat(node.position_x) || 0,
            y: parseFloat(node.position_y) || 0
        },
        data: node.data || {},
        style: node.style,
    })) || workflow.nodes || [];

    const edges = workflow.workflow_edges?.map(edge => ({
        id: edge.edge_id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        type: edge.type || 'smoothstep',
        style: edge.style,
        markerEnd: edge.marker_end,
        animated: edge.animated || false,
    })) || workflow.edges || [];

    return (
        <UserLayout title={`Workflow: ${workflow.name}`}>
            <Head title={`Workflow: ${workflow.name}`} />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-4 py-2 text-2xl font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Tên workflow"
                                />
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Mô tả workflow"
                                    rows={3}
                                />
                                <input
                                    type="text"
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                    className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Danh mục"
                                />
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {saving ? 'Đang lưu...' : 'Lưu'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditName(workflow.name);
                                            setEditDescription(workflow.description || '');
                                            setEditCategory(workflow.category || '');
                                        }}
                                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {workflow.name}
                                </h2>
                                {workflow.description && (
                                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                                        {workflow.description}
                                    </p>
                                )}
                                <div className="flex items-center space-x-4 mt-4">
                                    {workflow.category && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                            {workflow.category}
                                        </span>
                                    )}
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        workflow.is_active
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                        {workflow.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        workflow.is_public
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                        {workflow.is_public ? 'Công khai' : 'Riêng tư'}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {workflow.usage_count || 0} lần sử dụng
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {!isEditing && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    Chỉnh sửa
                                </button>
                                <button
                                    onClick={handleDuplicate}
                                    className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800"
                                >
                                    Sao chép
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800"
                                >
                                    Xóa
                                </button>
                            </>
                        )}
                        <Link
                            href={route('chat.index')}
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>Chuyển sang Chat</span>
                        </Link>
                        <Link
                            href={route('workflows.index')}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            Quay lại
                        </Link>
                    </div>
                </div>

                {/* Workflow Info */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Số nodes</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {nodes.length}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Số edges</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {edges.length}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Ngày tạo</p>
                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                                {new Date(workflow.created_at).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Flow Viewer */}
                {nodes.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Workflow Flow
                            </h3>
                            <button
                                onClick={() => setShowFlowViewer(!showFlowViewer)}
                                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                {showFlowViewer ? 'Ẩn' : 'Hiện'} Flow
                            </button>
                        </div>
                        {showFlowViewer && (
                            <div className="h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <FlowViewer
                                    isOpen={true}
                                    onClose={() => setShowFlowViewer(false)}
                                    nodes={nodes}
                                    edges={edges}
                                    toolCalls={workflow.tool_calls || []}
                                    tasks={workflow.tasks || []}
                                    autoShow={false}
                                    workflowId={workflow.id}
                                    onWorkflowSaved={(savedWorkflow) => {
                                        console.log('Workflow saved:', savedWorkflow);
                                        router.reload();
                                    }}
                                    workflowName={workflow.name}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogProps} />
        </UserLayout>
    );
}

