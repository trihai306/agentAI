export default function TransactionStatusBadge({ status }) {
    const getStatusConfig = (status) => {
        const configs = {
            pending: {
                label: 'Chờ duyệt',
                className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            },
            completed: {
                label: 'Hoàn thành',
                className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            },
            failed: {
                label: 'Thất bại',
                className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            },
            cancelled: {
                label: 'Đã hủy',
                className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            },
        };
        return configs[status] || {
            label: status,
            className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        };
    };

    const config = getStatusConfig(status);

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
        </span>
    );
}

