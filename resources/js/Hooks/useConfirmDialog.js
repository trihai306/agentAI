import { useState, useCallback } from 'react';

/**
 * Custom hook để quản lý ConfirmDialog state
 *
 * @returns {Object} { showDialog, confirmDialog, hideDialog, dialogProps }
 *
 * @example
 * const { showDialog, confirmDialog, hideDialog, dialogProps } = useConfirmDialog();
 *
 * // Show dialog
 * confirmDialog({
 *   title: 'Xóa item',
 *   message: 'Bạn có chắc chắn muốn xóa?',
 *   onConfirm: () => {
 *     // Handle confirm
 *     hideDialog();
 *   }
 * });
 */
export default function useConfirmDialog() {
    const [dialogState, setDialogState] = useState({
        show: false,
        title: 'Xác nhận',
        message: 'Bạn có chắc chắn muốn thực hiện hành động này?',
        description: '',
        confirmLabel: 'Xác nhận',
        cancelLabel: 'Hủy',
        variant: 'danger',
        customIcon: null,
        size: 'md',
        onConfirm: null,
    });

    const showDialog = useCallback((props = {}) => {
        setDialogState({
            show: true,
            title: props.title || 'Xác nhận',
            message: props.message || 'Bạn có chắc chắn muốn thực hiện hành động này?',
            description: props.description || '',
            confirmLabel: props.confirmLabel || 'Xác nhận',
            cancelLabel: props.cancelLabel || 'Hủy',
            variant: props.variant || 'danger',
            customIcon: props.customIcon || null,
            size: props.size || 'md',
            onConfirm: props.onConfirm || null,
        });
    }, []);

    const hideDialog = useCallback(() => {
        setDialogState((prev) => ({
            ...prev,
            show: false,
        }));
    }, []);

    const confirmDialog = useCallback((props = {}) => {
        showDialog(props);
    }, [showDialog]);

    const handleConfirm = useCallback(() => {
        if (dialogState.onConfirm) {
            dialogState.onConfirm();
        }
        hideDialog();
    }, [dialogState.onConfirm, hideDialog]);

    return {
        showDialog,
        confirmDialog,
        hideDialog,
        handleConfirm,
        dialogProps: {
            show: dialogState.show,
            title: dialogState.title,
            message: dialogState.message,
            description: dialogState.description,
            confirmLabel: dialogState.confirmLabel,
            cancelLabel: dialogState.cancelLabel,
            variant: dialogState.variant,
            customIcon: dialogState.customIcon,
            size: dialogState.size,
            onClose: hideDialog,
            onConfirm: handleConfirm,
        },
    };
}

