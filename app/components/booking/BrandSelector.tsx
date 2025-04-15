'use client';

import * as React from 'react';
import { UniversalDropdown } from '@/app/components/ui/UniversalDropdown'; // Import UniversalDropdown
// Removed import of BRANDS constant

// Define the structure expected by the API response / useSelectOptions hook
// This might need adjustment based on the actual API response structure if different
interface Brand {
    id: string;
    name: string;
    // Add other potential fields if needed for type compatibility
    [key: string]: unknown;
}

// Remove duplicated interface definition above

// Correct interface definition
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
            <label className="block text-m font-medium mb-2">Выберите Бренд</label>
            <UniversalDropdown<Brand> // Add back generic type for API usage
                mode="single"
                // Re-introduce API fetching props
                apiUrl="/api/brands"
                valueField="id" // Assuming 'id' is the value field from API
                labelField="name" // Assuming 'name' is the label field from API
                initialFetchLimit={100} // Pass the initial limit
                debounceDelay={300} // Pass debounce delay (optional, defaults to 300 in hook)
                loaderMessage="Загрузка списка брендов..."
                errorMessage="Не удалось загрузить список брендов."
                // Selection props
                selected={value}
                onChange={selectedValue => {
                    // Adapt the onChange from UniversalDropdown (string | string[] | null)
                    // to the expected BrandSelector onChange (string | null)
                    if (Array.isArray(selectedValue)) {
                        // This shouldn't happen in single mode, but handle defensively
                        console.error(
                            'Unexpected behavior: BrandSelector received an array value in single mode. This should not happen.',
                            selectedValue,
                        );
                        onChange(selectedValue[0] ?? null); // Use the first value if available, otherwise null
                    } else {
                        onChange(selectedValue);
                    }
                }}
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
