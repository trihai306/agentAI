/**
 * Professional Toast Notification System using Flowbite
 */

export const toast = {
    success: (message, duration = 5000) => {
        showToast(message, 'success', duration);
    },

    error: (message, duration = 5000) => {
        showToast(message, 'error', duration);
    },

    info: (message, duration = 5000) => {
        showToast(message, 'info', duration);
    },

    warning: (message, duration = 5000) => {
        showToast(message, 'warning', duration);
    },
};

function showToast(message, type = 'info', duration = 5000) {
    // Remove existing toasts to prevent stacking
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    });

    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast-notification fixed top-4 right-4 z-[9999] flex items-center w-full max-w-md p-4 mb-4 rounded-2xl shadow-2xl border backdrop-blur-sm transform transition-all duration-300 ease-in-out translate-x-0 opacity-100`;

    const config = getToastConfig(type);
    toast.className += ` ${config.bg} ${config.border} ${config.text}`;

    toast.innerHTML = `
        <div class="inline-flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl ${config.iconBg}">
            ${config.icon}
        </div>
        <div class="ml-4 flex-1">
            <div class="text-sm font-semibold ${config.titleColor} mb-1">${config.title}</div>
            <div class="text-sm ${config.messageColor}">${message}</div>
        </div>
        <button
            type="button"
            onclick="document.getElementById('${toastId}').remove()"
            class="ml-4 -mx-1.5 -my-1.5 ${config.closeButton} rounded-lg p-1.5 inline-flex h-8 w-8 hover:opacity-75 transition-opacity"
        >
            <span class="sr-only">Đóng</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 10);

    // Auto remove
    if (duration > 0) {
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

function getToastConfig(type) {
    const configs = {
        success: {
            bg: 'bg-white dark:bg-gray-800',
            border: 'border-green-200 dark:border-green-800',
            text: 'text-gray-900 dark:text-white',
            iconBg: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
            icon: `
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
            `,
            title: 'Thành công',
            titleColor: 'text-green-800 dark:text-green-200',
            messageColor: 'text-gray-700 dark:text-gray-300',
            closeButton: 'text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800',
        },
        error: {
            bg: 'bg-white dark:bg-gray-800',
            border: 'border-red-200 dark:border-red-800',
            text: 'text-gray-900 dark:text-white',
            iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
            icon: `
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            `,
            title: 'Lỗi',
            titleColor: 'text-red-800 dark:text-red-200',
            messageColor: 'text-gray-700 dark:text-gray-300',
            closeButton: 'text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800',
        },
        info: {
            bg: 'bg-white dark:bg-gray-800',
            border: 'border-blue-200 dark:border-blue-800',
            text: 'text-gray-900 dark:text-white',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
            icon: `
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
            `,
            title: 'Thông tin',
            titleColor: 'text-blue-800 dark:text-blue-200',
            messageColor: 'text-gray-700 dark:text-gray-300',
            closeButton: 'text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800',
        },
        warning: {
            bg: 'bg-white dark:bg-gray-800',
            border: 'border-yellow-200 dark:border-yellow-800',
            text: 'text-gray-900 dark:text-white',
            iconBg: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
            icon: `
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
            `,
            title: 'Cảnh báo',
            titleColor: 'text-yellow-800 dark:text-yellow-200',
            messageColor: 'text-gray-700 dark:text-gray-300',
            closeButton: 'text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800',
        },
    };

    return configs[type] || configs.info;
}

// Export for global use
if (typeof window !== 'undefined') {
    window.toast = toast;
}

