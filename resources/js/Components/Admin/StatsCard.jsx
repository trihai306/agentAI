export default function StatsCard({ title, value, icon, color = 'blue', trend, trendLabel }) {
    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
        purple: 'bg-purple-500',
        indigo: 'bg-indigo-500',
    };

    const iconBgClasses = {
        blue: 'bg-blue-100 dark:bg-blue-900',
        green: 'bg-green-100 dark:bg-green-900',
        yellow: 'bg-yellow-100 dark:bg-yellow-900',
        red: 'bg-red-100 dark:bg-red-900',
        purple: 'bg-purple-100 dark:bg-purple-900',
        indigo: 'bg-indigo-100 dark:bg-indigo-900',
    };

    const iconTextClasses = {
        blue: 'text-blue-600 dark:text-blue-300',
        green: 'text-green-600 dark:text-green-300',
        yellow: 'text-yellow-600 dark:text-yellow-300',
        red: 'text-red-600 dark:text-red-300',
        purple: 'text-purple-600 dark:text-purple-300',
        indigo: 'text-indigo-600 dark:text-indigo-300',
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                    {trend !== undefined && trendLabel && (
                        <div className="flex items-center mt-2">
                            <span
                                className={`text-sm font-medium ${
                                    trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}
                            >
                                {trend >= 0 ? '+' : ''}
                                {trend}%
                            </span>
                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{trendLabel}</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-full ${iconBgClasses[color]}`}>
                    <div className={iconTextClasses[color]}>{icon}</div>
                </div>
            </div>
        </div>
    );
}

