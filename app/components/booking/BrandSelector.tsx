'use client';

import * as React from 'react';
// Removed useState, useEffect, useCallback, useRef, toast, useLoaderStore, debounce
import { SimpleSelectDropdown } from './SimpleSelectDropdown';
import { useSelectOptions } from '@/lib/hooks/useSelectOptions'; // Import the new hook
interface Brand {
    id: string;
    name: string;
    supplierInn?: string | null;
}

interface BrandSelectorProps {
    value: string | null; // Currently selected brand ID
    onChange: (value: string | null) => void; // Callback when selection changes
    disabled?: boolean;
}

export function BrandSelector({ value, onChange, disabled }: BrandSelectorProps) {
    // Use the generic hook to fetch and manage brand options
    const {
        options: brandOptions, // Renamed from 'options' for clarity
        isLoading, // Can use this if specific loading state needed here
        // error, // Error handling is done within the hook via toast
        handleSearchChange,
    } = useSelectOptions<Brand>({
        apiUrl: '/api/brands',
        valueField: 'id',
        labelField: 'name',
        initialFetchLimit: 100, // Fetch initial 100 brands
        loaderMessage: 'Загрузка списка брендов...',
        errorMessage: 'Не удалось загрузить список брендов.',
    });

    // Find the label for the currently selected value from the options provided by the hook
    const currentSelectedLabel = brandOptions.find(option => option.value === value)?.label;

    // Handle null value for onChange
    const handleChange = (selectedValue: string | null) => {
        onChange(selectedValue === '' ? null : selectedValue);
    };

    return (
        <div className="w-full max-w mb-6">
            <label className="block text-m font-medium mb-2 mt-4">Выберите Бренд</label>
            <SimpleSelectDropdown
                title="Выберите Бренд"
                options={brandOptions} // Use options from the hook
                selected={value}
                selectedLabel={currentSelectedLabel} // Pass the found label
                onChange={handleChange}
                onSearchChange={handleSearchChange} // Use search handler from the hook
                placeholder="Поиск бренда..."
                isDisabled={disabled || isLoading} // Optionally disable while loading
                className="w-full" // Apply full width
            />
            {/* Loading/error messages are handled globally */}
        </div>
    );
}
