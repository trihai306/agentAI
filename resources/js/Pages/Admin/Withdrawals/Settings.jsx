import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import route from '../../../Utils/route';

export default function WithdrawalsSettings({ settings }) {
    const { data, setData, put, processing, errors } = useForm({
        auto_approve_threshold: settings?.auto_approve_threshold || 0,
        min_withdrawal: settings?.min_withdrawal || 0,
        max_withdrawal: settings?.max_withdrawal || 0,
        fee_percentage: settings?.fee_percentage || 0,
        fee_fixed: settings?.fee_fixed || 0,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.withdrawals.settings.update'));
    };

    return (
        <AdminLayout title="Cài đặt rút tiền">
            <Head title="Cài đặt rút tiền" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Cài đặt rút tiền
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Cấu hình các thông số rút tiền
                        </p>
                    </div>
                    <Link
                        href={route('admin.withdrawals.index')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Quay lại
                    </Link>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Cấu hình rút tiền
                        </h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Ngưỡng tự động duyệt (VND) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.auto_approve_threshold}
                                    onChange={(e) => setData('auto_approve_threshold', parseFloat(e.target.value) || 0)}
                                    className={`bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${
                                        errors.auto_approve_threshold ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0"
                                    required
                                />
                                {errors.auto_approve_threshold && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.auto_approve_threshold}
                                    </p>
                                )}
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Số tiền rút dưới ngưỡng này sẽ được tự động duyệt
                                </p>
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Số tiền rút tối thiểu (VND) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.min_withdrawal}
                                    onChange={(e) => setData('min_withdrawal', parseFloat(e.target.value) || 0)}
                                    className={`bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${
                                        errors.min_withdrawal ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0"
                                    required
                                />
                                {errors.min_withdrawal && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.min_withdrawal}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Số tiền rút tối đa (VND) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.max_withdrawal}
                                    onChange={(e) => setData('max_withdrawal', parseFloat(e.target.value) || 0)}
                                    className={`bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${
                                        errors.max_withdrawal ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0"
                                    required
                                />
                                {errors.max_withdrawal && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.max_withdrawal}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Phí phần trăm (%) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={data.fee_percentage}
                                    onChange={(e) => setData('fee_percentage', parseFloat(e.target.value) || 0)}
                                    className={`bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${
                                        errors.fee_percentage ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0"
                                    required
                                />
                                {errors.fee_percentage && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.fee_percentage}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Phí cố định (VND) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.fee_fixed}
                                    onChange={(e) => setData('fee_fixed', parseFloat(e.target.value) || 0)}
                                    className={`bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${
                                        errors.fee_fixed ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0"
                                    required
                                />
                                {errors.fee_fixed && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.fee_fixed}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end space-x-4">
                        <Link
                            href={route('admin.withdrawals.index')}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            Hủy
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Đang xử lý...' : 'Lưu cài đặt'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

