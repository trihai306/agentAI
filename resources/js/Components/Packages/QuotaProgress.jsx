export default function QuotaProgress({ quotaUsed, quotaTotal, label = 'Quota' }) {
    const percentage = quotaTotal > 0 ? (quotaUsed / quotaTotal) * 100 : 0;
    const remaining = quotaTotal - quotaUsed;

    const getColor = () => {
        if (percentage >= 90) return 'progress-error';
        if (percentage >= 70) return 'progress-warning';
        return 'progress-success';
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="text-base-content/70">{label}</span>
                <span className="font-medium">
                    {new Intl.NumberFormat('vi-VN').format(quotaUsed)} / {new Intl.NumberFormat('vi-VN').format(quotaTotal)}
                </span>
            </div>
            <progress
                className={`progress ${getColor()} w-full`}
                value={quotaUsed}
                max={quotaTotal}
            ></progress>
            <div className="flex items-center justify-between text-xs text-base-content/50">
                <span>Còn lại: {new Intl.NumberFormat('vi-VN').format(remaining)}</span>
                <span>{percentage.toFixed(1)}%</span>
            </div>
        </div>
    );
}
