'use client';

import * as React from 'react';
// Removed SimpleSelectDropdown and useSelectOptions imports
import { UniversalDropdown } from '@/app/components/ui/UniversalDropdown'; // Import UniversalDropdown
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
    // Removed useSelectOptions hook call and related logic (isLoading, handleSearchChange, currentSelectedLabel, handleChange)
    // UniversalDropdown handles data fetching internally

    return (
        <div className="w-full max-w mb-6">
            <label className="block text-m font-medium mb-2 mt-4">Выберите Бренд</label>
            <UniversalDropdown<Brand> // Specify the type if needed for valueField/labelField
                mode="single"
                // Data fetching props passed directly
                apiUrl="/api/brands"
                valueField="id"
                labelField="name"
                initialFetchLimit={100}
                loaderMessage="Загрузка списка брендов..."
                errorMessage="Не удалось загрузить список брендов."
                // Selection props
                selected={value}
                onChange={onChange} // Pass the original onChange directly
                // UI props
                title="Выберите Бренд" // Optional title context
                triggerPlaceholder="Выберите Бренд" // Placeholder for the button
                placeholder="Поиск бренда..." // Placeholder for the search input
                isDisabled={disabled} // Pass disabled prop (UniversalDropdown handles internal loading state)
                className="w-full" // Apply full width to the trigger button
            />
            {/* Loading/error messages are handled globally */}
        </div>
    );
}
