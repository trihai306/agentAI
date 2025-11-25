import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import UserLayout from '../../Layouts/UserLayout';
import route from '../../Utils/route';

export default function WalletDeposit() {
    const [selectedMethod, setSelectedMethod] = useState('bank_transfer');
    const [quickAmount, setQuickAmount] = useState(null);
    const [step, setStep] = useState(1); // 1: Amount, 2: Method, 3: Info, 4: Confirm

    const { data, setData, post, processing, errors } = useForm({
        amount: '',
        payment_method: 'bank_transfer',
        payment_info: {
            bank_name: '',
            account_number: '',
            account_holder: '',
            transaction_code: '',
            phone_number: '',
        },
        description: '',
    });

    const paymentMethods = [
        {
            id: 'bank_transfer',
            name: 'Chuyển khoản ngân hàng',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
            description: 'Chuyển khoản qua ngân hàng',
            color: 'blue',
            gradient: 'from-blue-500 to-blue-600',
            bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
        },
        {
            id: 'momo',
            name: 'Ví MoMo',
            icon: (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            ),
            description: 'Thanh toán qua ví MoMo',
            color: 'pink',
            gradient: 'from-pink-500 to-rose-600',
            bgGradient: 'from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-800/20',
        },
        {
            id: 'zalopay',
            name: 'ZaloPay',
            icon: (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            ),
            description: 'Thanh toán qua ZaloPay',
            color: 'blue',
            gradient: 'from-blue-500 to-cyan-600',
            bgGradient: 'from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20',
        },
        {
            id: 'credit_card',
            name: 'Thẻ tín dụng',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
            description: 'Thanh toán bằng thẻ tín dụng',
            color: 'purple',
            gradient: 'from-purple-500 to-indigo-600',
            bgGradient: 'from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-800/20',
        },
    ];

    const quickAmounts = [
        { amount: 50000, label: '50K' },
        { amount: 100000, label: '100K' },
        { amount: 200000, label: '200K' },
        { amount: 500000, label: '500K' },
        { amount: 1000000, label: '1M' },
        { amount: 2000000, label: '2M' },
    ];

    const formatCurrency = (value) => {
        if (!value) return '';
        return new Intl.NumberFormat('vi-VN').format(value);
    };

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        setData('amount', value);
        setQuickAmount(null);
    };

    const handleQuickAmount = (amount) => {
        setData('amount', amount.toString());
        setQuickAmount(amount);
    };

    const handleMethodChange = (methodId) => {
        setSelectedMethod(methodId);
        setData('payment_method', methodId);
    };

    const canProceedToStep2 = () => {
        const amountValue = parseFloat(data.amount.replace(/\D/g, '')) || 0;
        return amountValue >= 10000;
    };

    const canProceedToStep3 = () => {
        return selectedMethod && data.payment_method;
    };

    const canProceedToStep4 = () => {
        if (selectedMethod === 'bank_transfer') {
            return data.payment_info.bank_name && data.payment_info.account_number && data.payment_info.account_holder;
        } else if (selectedMethod === 'momo' || selectedMethod === 'zalopay') {
            return data.payment_info.phone_number;
        }
        return true;
    };

    const submit = (e) => {
        e.preventDefault();
        const amountValue = parseFloat(data.amount.replace(/\D/g, '')) || 0;
        if (amountValue < 10000) {
            return;
        }
        router.post(route('wallet.deposit.process'), {
            amount: amountValue,
            payment_method: data.payment_method,
            payment_info: data.payment_info,
            description: data.description || '',
        });
    };

    const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);

    return (
        <UserLayout title="Nạp tiền">
            <Head title="Nạp tiền vào ví" />
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <Link href={route('wallet.show')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Ví tiền
                        </Link>
                        <span>/</span>
                        <span className="text-gray-900 dark:text-white font-medium">Nạp tiền</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent mb-3">
                                Nạp tiền vào ví
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-lg">
                                Chọn phương thức thanh toán và số tiền bạn muốn nạp
                            </p>
                        </div>
                        <div className="hidden lg:block">
                            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {[
                            { step: 1, label: 'Số tiền', icon: '💰' },
                            { step: 2, label: 'Phương thức', icon: '💳' },
                            { step: 3, label: 'Thông tin', icon: '📝' },
                            { step: 4, label: 'Xác nhận', icon: '✓' },
                        ].map((item, index) => (
                            <div key={item.step} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                                        step >= item.step
                                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg scale-110'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {step > item.step ? '✓' : item.icon}
                                    </div>
                                    <p className={`mt-2 text-xs font-medium ${
                                        step >= item.step
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {item.label}
                                    </p>
                                </div>
                                {index < 3 && (
                                    <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                                        step > item.step
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                                            : 'bg-gray-200 dark:bg-gray-700'
                                    }`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Step 1: Amount Selection */}
                    {step === 1 && (
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                    <span className="text-2xl">💰</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Chọn số tiền nạp
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Số tiền tối thiểu: 10,000 VNĐ
                                    </p>
                                </div>
                            </div>

                            {/* Quick Amount Buttons */}
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-8">
                                {quickAmounts.map((item) => (
                                    <button
                                        key={item.amount}
                                        type="button"
                                        onClick={() => handleQuickAmount(item.amount)}
                                        className={`relative px-4 py-5 rounded-2xl font-bold text-sm transition-all duration-300 transform ${
                                            quickAmount === item.amount
                                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl scale-110 ring-4 ring-blue-200 dark:ring-blue-800'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                                        }`}
                                    >
                                        <div className="text-lg">{item.label}</div>
                                        <div className="text-xs opacity-75 mt-1">
                                            {formatCurrency(item.amount)}
                                        </div>
                                        {quickAmount === item.amount && (
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Amount Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Hoặc nhập số tiền tùy chọn
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                    <input
                                        type="text"
                                        value={formatCurrency(data.amount)}
                                        onChange={handleAmountChange}
                                        placeholder="Nhập số tiền..."
                                        className="relative w-full px-6 py-5 text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                        autoFocus
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                        <span className="text-xl font-bold text-gray-500 dark:text-gray-400">VNĐ</span>
                                    </div>
                                </div>
                                {errors.amount && (
                                    <p className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span>{errors.amount}</span>
                                    </p>
                                )}
                                {data.amount && parseFloat(data.amount.replace(/\D/g, '')) < 10000 && (
                                    <p className="mt-3 text-sm text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span>Số tiền tối thiểu là 10,000 VNĐ</span>
                                    </p>
                                )}
                            </div>

                            {/* Info Card */}
                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                <div className="flex items-start space-x-3">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm text-blue-800 dark:text-blue-200">
                                        <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
                                        <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                                            <li>Số tiền tối thiểu: 10,000 VNĐ</li>
                                            <li>Giao dịch sẽ được xử lý trong vòng 24 giờ</li>
                                            <li>Vui lòng kiểm tra kỹ thông tin trước khi xác nhận</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    disabled={!canProceedToStep2()}
                                    className="px-8 py-4 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    <span>Tiếp theo</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Payment Method */}
                    {step === 2 && (
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <span className="text-2xl">💳</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Chọn phương thức thanh toán
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Chọn phương thức phù hợp với bạn
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => handleMethodChange(method.id)}
                                        className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${
                                            selectedMethod === method.id
                                                ? `bg-gradient-to-br ${method.bgGradient} border-${method.color}-500 shadow-2xl scale-105 ring-4 ring-${method.color}-200 dark:ring-${method.color}-800`
                                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-4 rounded-xl ${
                                                selectedMethod === method.id
                                                    ? `bg-gradient-to-br ${method.gradient} text-white`
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            } transition-all duration-300`}>
                                                {method.icon}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                                                    {method.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {method.description}
                                                </p>
                                            </div>
                                            {selectedMethod === method.id && (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg animate-pulse">
                                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {errors.payment_method && (
                                <p className="mt-4 text-sm text-red-600 dark:text-red-400">{errors.payment_method}</p>
                            )}

                            <div className="mt-8 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3 font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    <span>Quay lại</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    disabled={!canProceedToStep3()}
                                    className="px-8 py-4 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    <span>Tiếp theo</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Payment Info */}
                    {step === 3 && (
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                                    <span className="text-2xl">📝</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Thông tin thanh toán
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Điền thông tin {selectedMethodData?.name.toLowerCase()}
                                    </p>
                                </div>
                            </div>

                            {selectedMethod === 'bank_transfer' && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Tên ngân hàng <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.payment_info.bank_name}
                                            onChange={(e) => setData('payment_info', { ...data.payment_info, bank_name: e.target.value })}
                                            className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-900 dark:text-white transition-all"
                                            placeholder="VD: Vietcombank, BIDV, Techcombank..."
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Số tài khoản <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.payment_info.account_number}
                                                onChange={(e) => setData('payment_info', { ...data.payment_info, account_number: e.target.value })}
                                                className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-900 dark:text-white transition-all"
                                                placeholder="Nhập số tài khoản"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Chủ tài khoản <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.payment_info.account_holder}
                                                onChange={(e) => setData('payment_info', { ...data.payment_info, account_holder: e.target.value })}
                                                className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-900 dark:text-white transition-all"
                                                placeholder="Tên chủ tài khoản"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Mã giao dịch / Nội dung chuyển khoản
                                        </label>
                                        <input
                                            type="text"
                                            value={data.payment_info.transaction_code}
                                            onChange={(e) => setData('payment_info', { ...data.payment_info, transaction_code: e.target.value })}
                                            className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-900 dark:text-white transition-all"
                                            placeholder="Nhập mã giao dịch (nếu có)"
                                        />
                                    </div>
                                </div>
                            )}

                            {(selectedMethod === 'momo' || selectedMethod === 'zalopay') && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Số điện thoại <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={data.payment_info.phone_number}
                                        onChange={(e) => setData('payment_info', { ...data.payment_info, phone_number: e.target.value })}
                                        className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-900 dark:text-white transition-all"
                                        placeholder="Nhập số điện thoại"
                                        required
                                    />
                                </div>
                            )}

                            <div className="mt-6">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Ghi chú (tùy chọn)
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-900 dark:text-white transition-all resize-none"
                                    placeholder="Thêm ghi chú cho giao dịch này..."
                                />
                            </div>

                            <div className="mt-8 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="px-6 py-3 font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    <span>Quay lại</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(4)}
                                    disabled={!canProceedToStep4()}
                                    className="px-8 py-4 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    <span>Xem lại</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirmation */}
                    {step === 4 && (
                        <div className="space-y-6">
                            {/* Summary Card */}
                            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-700 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold">Xác nhận giao dịch</h2>
                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                                            <span className="text-blue-100">Số tiền nạp:</span>
                                            <span className="text-3xl font-bold">
                                                {formatCurrency(data.amount)} VNĐ
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                                            <span className="text-blue-100">Phương thức:</span>
                                            <span className="text-lg font-semibold">
                                                {selectedMethodData?.name}
                                            </span>
                                        </div>
                                        {selectedMethod === 'bank_transfer' && (
                                            <>
                                                <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                                                    <span className="text-blue-100">Ngân hàng:</span>
                                                    <span className="text-lg font-semibold">
                                                        {data.payment_info.bank_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                                                    <span className="text-blue-100">Số tài khoản:</span>
                                                    <span className="text-lg font-semibold">
                                                        {data.payment_info.account_number}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Warning Card */}
                            <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-6">
                                <div className="flex items-start space-x-3">
                                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm text-amber-800 dark:text-amber-200">
                                        <p className="font-bold mb-2">Vui lòng kiểm tra kỹ thông tin trước khi xác nhận!</p>
                                        <p className="text-amber-700 dark:text-amber-300">
                                            Sau khi xác nhận, yêu cầu nạp tiền sẽ được gửi đến admin để xử lý.
                                            Vui lòng đợi admin phê duyệt trong vòng 24 giờ.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="flex-1 px-6 py-4 font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                                >
                                    Quay lại
                                </button>
                                <Link
                                    href={route('wallet.show')}
                                    className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                                >
                                    Hủy
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-8 py-4 font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {processing ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Đang xử lý...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Xác nhận nạp tiền</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </UserLayout>
    );
}
