import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';

export default function ModalForm({
    show = false,
    onClose,
    title = 'Form',
    fields = [],
    initialData = {},
    onSubmit,
    submitLabel = 'Lưu',
    cancelLabel = 'Hủy',
    size = 'md', // sm, md, lg, xl
}) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm(initialData);
    const [isOpen, setIsOpen] = useState(show);

    useEffect(() => {
        setIsOpen(show);
        if (show) {
            reset(initialData);
            clearErrors();
        }
    }, [show, initialData]);

    const handleClose = () => {
        setIsOpen(false);
        reset();
        clearErrors();
        if (onClose) {
            onClose();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(data, { router, processing, reset: handleClose });
        }
    };

    const renderField = (field) => {
        const fieldError = errors[field.name];
        const fieldValue = data[field.name] ?? '';

        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
            case 'password':
                return (
                    <div key={field.name}>
                        <label
                            htmlFor={field.name}
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <input
                            type={field.type}
                            id={field.name}
                            name={field.name}
                            value={fieldValue}
                            onChange={(e) => setData(field.name, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                            className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${
                                fieldError ? 'border-red-500' : ''
                            }`}
                            placeholder={field.placeholder}
                            required={field.required}
                            disabled={processing}
                        />
                        {fieldError && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldError}</p>
                        )}
                        {field.help && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{field.help}</p>
                        )}
                    </div>
                );

            case 'textarea':
                return (
                    <div key={field.name}>
                        <label
                            htmlFor={field.name}
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <textarea
                            id={field.name}
                            name={field.name}
                            rows={field.rows || 3}
                            value={fieldValue}
                            onChange={(e) => setData(field.name, e.target.value)}
                            className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${
                                fieldError ? 'border-red-500' : ''
                            }`}
                            placeholder={field.placeholder}
                            required={field.required}
                            disabled={processing}
                        />
                        {fieldError && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldError}</p>
                        )}
                        {field.help && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{field.help}</p>
                        )}
                    </div>
                );

            case 'select':
                return (
                    <div key={field.name}>
                        <label
                            htmlFor={field.name}
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <select
                            id={field.name}
                            name={field.name}
                            value={fieldValue}
                            onChange={(e) => setData(field.name, e.target.value)}
                            className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${
                                fieldError ? 'border-red-500' : ''
                            }`}
                            required={field.required}
                            disabled={processing}
                        >
                            {field.placeholder && (
                                <option value="">{field.placeholder}</option>
                            )}
                            {field.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {fieldError && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldError}</p>
                        )}
                        {field.help && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{field.help}</p>
                        )}
                    </div>
                );

            case 'checkbox':
                return (
                    <div key={field.name} className="flex items-center">
                        <input
                            id={field.name}
                            name={field.name}
                            type="checkbox"
                            checked={fieldValue || false}
                            onChange={(e) => setData(field.name, e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            disabled={processing}
                        />
                        <label
                            htmlFor={field.name}
                            className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                        >
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {fieldError && (
                            <p className="ml-2 text-sm text-red-600 dark:text-red-400">{fieldError}</p>
                        )}
                    </div>
                );

            case 'custom':
                return field.render ? (
                    <div key={field.name}>{field.render(data, setData, errors, processing)}</div>
                ) : null;

            default:
                return null;
        }
    };

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 dark:bg-opacity-80"
                onClick={handleClose}
            ></div>

            {/* Modal */}
            <div
                id="modal-form"
                className={`fixed top-0 left-0 right-0 z-50 w-full ${sizeClasses[size]} p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full mx-auto`}
            >
                <div className="relative w-full max-h-full bg-white rounded-lg shadow dark:bg-gray-800">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b rounded-t dark:border-gray-700">
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white">{title}</h3>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                ></path>
                            </svg>
                            <span className="sr-only">Đóng</span>
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4">
                            {fields.map((field) => renderField(field))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-700">
                            <button
                                type="submit"
                                disabled={processing}
                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Đang xử lý...' : submitLabel}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={processing}
                                className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {cancelLabel}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

