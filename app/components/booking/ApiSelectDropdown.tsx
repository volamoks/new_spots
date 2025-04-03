'use client';

import * as React from 'react';
import { SimpleSelectDropdown } from './SimpleSelectDropdown';
import { useSelectOptions } from '@/lib/hooks/useSelectOptions';

// Define the structure for the items fetched from the API
// Using a generic type T allows flexibility but requires specifying fields
// Alternatively, use a more specific type if all APIs return similar structures
// For simplicity, let's assume items have at least string-convertible id/name fields
interface ApiItem {
    [key: string]: unknown; // Use unknown instead of any for better type safety
}
interface ApiSelectDropdownProps<T extends ApiItem> {
    // --- Data Fetching Props (for useSelectOptions) ---
    apiUrl: string;
    valueField: keyof T;
    labelField: keyof T;
    initialFetchLimit?: number;
    searchParam?: string;
    limitParam?: string;
    debounceDelay?: number;
    loaderMessage?: string;
    errorMessage?: string;

    // --- SimpleSelectDropdown Props ---
    title: string; // Title for the dropdown trigger/label
    selected: string | null; // Currently selected value (ID/key)
    onChange: (value: string | null) => void; // Callback when selection changes
    placeholder?: string; // Placeholder for the search input
    triggerPlaceholder?: string; // Placeholder for the trigger button
    clearSelectionText?: string; // Text for the clear option
    emptySearchText?: string; // Text when search yields no results
    isDisabled?: boolean; // Disable the dropdown
    className?: string; // Optional class name for the trigger button
}

export function ApiSelectDropdown<T extends ApiItem>({
    // Destructure all props
    apiUrl,
    valueField,
    labelField,
    initialFetchLimit,
    searchParam,
    limitParam,
    debounceDelay,
    loaderMessage,
    errorMessage,
    title,
    selected,
    onChange,
    placeholder,
    triggerPlaceholder,
    clearSelectionText,
    emptySearchText,
    isDisabled = false, // Default isDisabled to false
    className,
}: ApiSelectDropdownProps<T>) {
    // Use the generic hook to fetch and manage options
    const {
        options,
        isLoading, // Get loading state from the hook
        handleSearchChange,
        // Error is handled by toast within the hook, but could be exposed if needed
    } = useSelectOptions<T>({
        apiUrl,
        valueField,
        labelField,
        initialFetchLimit,
        searchParam,
        limitParam,
        debounceDelay,
        loaderMessage,
        errorMessage,
    });

    // Find the label for the currently selected value from the fetched options
    const currentSelectedLabel = options.find(option => option.value === selected)?.label;

    // Handle null value conversion if SimpleSelectDropdown expects it
    // (Assuming SimpleSelectDropdown's onChange passes the selected *value* or null)
    const handleChange = (selectedValue: string | null) => {
        onChange(selectedValue); // Pass the value directly
    };

    return (
        <SimpleSelectDropdown
            title={title}
            options={options}
            selected={selected}
            selectedLabel={currentSelectedLabel} // Pass the found label
            onChange={handleChange}
            onSearchChange={handleSearchChange} // Pass the search handler from the hook
            placeholder={placeholder}
            triggerPlaceholder={triggerPlaceholder}
            clearSelectionText={clearSelectionText}
            emptySearchText={emptySearchText}
            // Disable if explicitly passed or while loading data
            isDisabled={isDisabled || isLoading}
            className={className}
        />
    );
}
