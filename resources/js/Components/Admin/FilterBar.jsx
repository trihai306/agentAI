import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function FilterBar({ filters = {}, filterConfig = [], onFilterChange }) {
    const [localFilters, setLocalFilters] = useState(filters);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };

    const clearFilters = () => {
        const clearedFilters = {};
        filterConfig.forEach((filter) => {
            if (filter.defaultValue !== undefined) {
                clearedFilters[filter.key] = filter.defaultValue;
            }
        });
        setLocalFilters(clearedFilters);
        if (onFilterChange) {
            onFilterChange(clearedFilters);
        }
    };

    const hasActiveFilters = filterConfig.some(
        (filter) => localFilters[filter.key] && localFilters[filter.key] !== filter.defaultValue
    );

    return (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow dark:bg-gray-800 mb-4">
            {filterConfig.map((filter) => {
                switch (filter.type) {
                    case 'select':
                        return (
                            <div key={filter.key} className="flex-1 min-w-[150px]">
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {filter.label}
                                </label>
                                <select
                                    value={localFilters[filter.key] || ''}
                                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                >
                                    <option value="">Tất cả</option>
                                    {filter.options?.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );

                    case 'date':
                        return (
                            <div key={filter.key} className="flex-1 min-w-[150px]">
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {filter.label}
                                </label>
                                <input
                                    type="date"
                                    value={localFilters[filter.key] || ''}
                                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                />
                            </div>
                        );

                    default:
                        return null;
                }
            })}
            {hasActiveFilters && (
                <div className="flex items-end">
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            )}
        </div>
    );
}

