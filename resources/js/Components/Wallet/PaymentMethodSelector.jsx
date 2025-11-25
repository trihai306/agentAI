import { useState, useEffect } from 'react';

export default function PaymentMethodSelector({ value, onChange, onPaymentInfoChange }) {
    const [paymentInfo, setPaymentInfo] = useState({
        phone: '',
        account_number: '',
        bank_name: '',
        account_holder: '',
    });

    useEffect(() => {
        onPaymentInfoChange(paymentInfo);
    }, [paymentInfo, onPaymentInfoChange]);

    const paymentMethods = [
        {
            value: 'bank_transfer',
            label: 'Chuyển khoản ngân hàng',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
        },
        {
            value: 'momo',
            label: 'Ví MoMo',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            value: 'zalopay',
            label: 'Ví ZaloPay',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
        },
        {
            value: 'credit_card',
            label: 'Thẻ tín dụng',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
        },
    ];

    const updatePaymentInfo = (key, val) => {
        const newInfo = { ...paymentInfo, [key]: val };
        setPaymentInfo(newInfo);
        onPaymentInfoChange(newInfo);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                    <button
                        key={method.value}
                        type="button"
                        onClick={() => onChange(method.value)}
                        className={`p-4 rounded-xl border transition-all ${
                            value === method.value
                                ? 'border-[#10a37f] bg-[#10a37f]/10'
                                : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]'
                        }`}
                    >
                        <div className="flex items-center space-x-3">
                            <div className={`${value === method.value ? 'text-[#10a37f]' : 'text-gray-400'}`}>
                                {method.icon}
                            </div>
                            <span className={`text-sm font-medium ${
                                value === method.value ? 'text-white' : 'text-gray-400'
                            }`}>
                                {method.label}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Payment Info Fields */}
            {value === 'bank_transfer' && (
                <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Số tài khoản <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={paymentInfo.account_number}
                            onChange={(e) => updatePaymentInfo('account_number', e.target.value)}
                            className="w-full px-4 py-2 bg-[#0a0e27] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#10a37f]"
                            placeholder="Nhập số tài khoản"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Tên ngân hàng <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={paymentInfo.bank_name}
                            onChange={(e) => updatePaymentInfo('bank_name', e.target.value)}
                            className="w-full px-4 py-2 bg-[#0a0e27] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#10a37f]"
                            placeholder="VD: Vietcombank, Techcombank..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Chủ tài khoản <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={paymentInfo.account_holder}
                            onChange={(e) => updatePaymentInfo('account_holder', e.target.value)}
                            className="w-full px-4 py-2 bg-[#0a0e27] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#10a37f]"
                            placeholder="Tên chủ tài khoản"
                            required
                        />
                    </div>
                </div>
            )}

            {(value === 'momo' || value === 'zalopay') && (
                <div className="pt-4 border-t border-white/[0.08]">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Số điện thoại <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="tel"
                        value={paymentInfo.phone}
                        onChange={(e) => updatePaymentInfo('phone', e.target.value)}
                        className="w-full px-4 py-2 bg-[#0a0e27] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#10a37f]"
                        placeholder="Nhập số điện thoại"
                        required
                    />
                </div>
            )}

            {value === 'credit_card' && (
                <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Số thẻ <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={paymentInfo.account_number}
                            onChange={(e) => updatePaymentInfo('account_number', e.target.value)}
                            className="w-full px-4 py-2 bg-[#0a0e27] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#10a37f]"
                            placeholder="1234 5678 9012 3456"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Tên chủ thẻ <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={paymentInfo.account_holder}
                            onChange={(e) => updatePaymentInfo('account_holder', e.target.value)}
                            className="w-full px-4 py-2 bg-[#0a0e27] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#10a37f]"
                            placeholder="Tên chủ thẻ"
                            required
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

