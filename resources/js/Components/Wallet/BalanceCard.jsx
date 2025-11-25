export default function BalanceCard({ wallet }) {
    return (
        <div className="stat bg-primary text-primary-content rounded-box shadow-xl mb-8">
            <div className="stat-figure">
                <div className="w-16 h-16 rounded-xl bg-primary-content/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>
            <div className="stat-title text-primary-content/80">Số dư hiện tại</div>
            <div className="stat-value">
                {new Intl.NumberFormat('vi-VN').format(wallet?.balance || 0)} VND
            </div>
            <div className="stat-desc text-primary-content/80 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ví nội bộ - {wallet?.currency || 'VND'}
            </div>
        </div>
    );
}
