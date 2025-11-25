/**
 * Utility function để show confirm dialog dễ dàng từ bất kỳ đâu
 * Sử dụng global state để quản lý dialog
 */

let globalDialogState = null;
let globalDialogSetter = null;

/**
 * Initialize global dialog state
 * Nên được gọi trong root component hoặc layout
 */
export function initConfirmDialog(setDialogState) {
    globalDialogSetter = setDialogState;
}

/**
 * Show confirm dialog
 * 
 * @param {Object} options
 * @param {string} options.title - Dialog title
 * @param {string} options.message - Dialog message
 * @param {string} options.description - Optional description
 * @param {string} options.confirmLabel - Confirm button label
 * @param {string} options.cancelLabel - Cancel button label
 * @param {string} options.variant - 'danger' | 'warning' | 'info' | 'success'
 * @param {Function} options.onConfirm - Callback khi confirm
 * @param {ReactNode} options.customIcon - Custom icon
 * @param {string} options.size - 'sm' | 'md' | 'lg'
 * 
 * @returns {Promise<boolean>} Promise resolves to true if confirmed, false if cancelled
 * 
 * @example
 * const confirmed = await confirmAction({
 *   title: 'Xóa item',
 *   message: 'Bạn có chắc chắn muốn xóa?',
 *   variant: 'danger'
 * });
 * 
 * if (confirmed) {
 *   // Handle delete
 * }
 */
export function confirmAction(options = {}) {
    return new Promise((resolve) => {
        if (!globalDialogSetter) {
            console.warn('confirmAction: Global dialog state not initialized. Using window.confirm as fallback.');
            const result = window.confirm(options.message || 'Bạn có chắc chắn muốn thực hiện hành động này?');
            resolve(result);
            return;
        }

        globalDialogSetter({
            show: true,
            title: options.title || 'Xác nhận',
            message: options.message || 'Bạn có chắc chắn muốn thực hiện hành động này?',
            description: options.description || '',
            confirmLabel: options.confirmLabel || 'Xác nhận',
            cancelLabel: options.cancelLabel || 'Hủy',
            variant: options.variant || 'danger',
            customIcon: options.customIcon || null,
            size: options.size || 'md',
            onConfirm: () => {
                if (options.onConfirm) {
                    options.onConfirm();
                }
                resolve(true);
            },
            onClose: () => {
                resolve(false);
            },
        });
    });
}

/**
 * Quick confirm functions for common variants
 */
export const confirm = {
    danger: (message, title = 'Xác nhận xóa') => {
        return confirmAction({ title, message, variant: 'danger' });
    },
    warning: (message, title = 'Cảnh báo') => {
        return confirmAction({ title, message, variant: 'warning' });
    },
    info: (message, title = 'Xác nhận') => {
        return confirmAction({ title, message, variant: 'info' });
    },
    success: (message, title = 'Xác nhận') => {
        return confirmAction({ title, message, variant: 'success' });
    },
};

// Export for global use
if (typeof window !== 'undefined') {
    window.confirmAction = confirmAction;
    window.confirm = confirm;
}

