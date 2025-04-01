'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { ZoneStatus } from '@/types/zone';
import { debounce } from '@/lib/utils/debounce';
// Import the Zustand store hook
import { useZonesManagementStore } from '@/lib/stores/zonesManagementStore';
// Import loader store hook for the loading state
import { useLoaderStore } from '@/lib/stores/loaderStore';

// Interface for filter values remains useful internally
export interface ZoneFilterValues {
    searchTerm: string;
    statusFilter: string; // Or ZoneStatus | 'all'
}

export function ZoneFilters() {
    // Consume Zustand store
    const { handleFilterChange, onRefresh } = useZonesManagementStore(state => ({
        handleFilterChange: state.handleFilterChange,
        onRefresh: state.onRefresh,
    }));
    // Consume loader store for loading state
    const isLoading = useLoaderStore(state => state.isLoading);

    // Internal state for local input control remains the same
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Debounced callback for search term changes
    const debouncedOnFilterChange = useCallback(
        // Wrap the callback to match the generic debounce signature
        debounce((...args: unknown[]) => {
            if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
                handleFilterChange(args[0] as ZoneFilterValues); // Call store action
            }
        }, 300),
        [handleFilterChange], // Depend on the action from the store
    );

    // Effect to call the debounced store action whenever filters change
    useEffect(() => {
        debouncedOnFilterChange({ searchTerm, statusFilter });
        return () => debouncedOnFilterChange.cancel?.();
    }, [searchTerm, statusFilter, debouncedOnFilterChange]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleStatusChange = (newStatus: string) => {
        setStatusFilter(newStatus);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
                <Input
                    placeholder="Поиск по городу, магазину, макрозоне..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full"
                />
            </div>
            <div className="w-full sm:w-auto">
                <button
                    onClick={onRefresh} // Use store action
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading} // Use loader store state
                >
                    Обновить данные
                </button>
            </div>
            <div className="w-full sm:w-48">
                <div className="border rounded-md p-2">
                    <div className="text-sm text-gray-500 mb-2">Фильтр по статусу:</div>
                    <div className="flex flex-col space-y-1">
                        <button
                            onClick={() => handleStatusChange('all')}
                            className={`text-xs px-2 py-1 rounded ${
                                statusFilter === 'all'
                                    ? 'bg-gray-200 text-gray-800 font-bold'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Все статусы
                        </button>
                        <button
                            onClick={() => handleStatusChange(ZoneStatus.AVAILABLE)}
                            className={`text-xs px-2 py-1 rounded ${
                                statusFilter === ZoneStatus.AVAILABLE
                                    ? 'bg-green-200 text-green-800 font-bold'
                                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                        >
                            Доступна
                        </button>
                        <button
                            onClick={() => handleStatusChange(ZoneStatus.BOOKED)}
                            className={`text-xs px-2 py-1 rounded ${
                                statusFilter === ZoneStatus.BOOKED
                                    ? 'bg-blue-200 text-blue-800 font-bold'
                                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            }`}
                        >
                            Забронирована
                        </button>
                        <button
                            onClick={() => handleStatusChange(ZoneStatus.UNAVAILABLE)}
                            className={`text-xs px-2 py-1 rounded ${
                                statusFilter === ZoneStatus.UNAVAILABLE
                                    ? 'bg-red-200 text-red-800 font-bold'
                                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                        >
                            Недоступна
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
