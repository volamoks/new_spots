import React from 'react';
// import { SimpleZoneFilterDropdown } from '@/app/components/zones/SimpleZoneFilterDropdown'; // Replaced
import { UniversalDropdown } from '@/app/components/ui/UniversalDropdown'; // Corrected import path
import type { BookingRequestFilters } from '@/lib/stores/bookingRequestStore'; // Assuming T will be BookingRequestFilters

// Define the structure for a single dropdown's configuration
interface DropdownConfig<T> {
    title: string;
    options: Array<{ value: string; label: string }>;
    selected: string[] | undefined;
    filterKey: keyof T & string;
    gridColsClass?: string; // Optional class for grid column span
}

interface DropdownFilterGroupProps<T> {
    groupTitle: string;
    dropdowns: Array<DropdownConfig<T>>;
    setFilterCriteria: (criteria: Partial<T>) => void;
    isLoading: boolean;
}

// Use BookingRequestFilters as the default type for T if not specified
export function DropdownFilterGroup<T = BookingRequestFilters>({
    groupTitle,
    dropdowns,
    setFilterCriteria,
    isLoading,
}: DropdownFilterGroupProps<T>) {
    return (
        <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
                {groupTitle} {/* TODO: i18n */}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {dropdowns.map(config => (
                    <UniversalDropdown
                        key={config.filterKey}
                        mode="multiple" // Assuming these are multi-select based on SimpleZoneFilterDropdown usage
                        title={config.title} /* TODO: i18n */
                        options={config.options}
                        selected={config.selected || []} // Pass selected array
                        onChange={(newValue: string | string[] | null) => {
                            // Accept the broader type
                            // Added type annotation
                            // Ensure newValue is always an array for multi-select
                            // Ensure newValue is an array before updating state for multi-select mode
                            if (Array.isArray(newValue)) {
                                setFilterCriteria({ [config.filterKey]: newValue } as Partial<T>);
                            }
                            // If newValue is not an array (which shouldn't happen in multi-mode), do nothing or handle error
                        }}
                        isDisabled={isLoading}
                        className={config.gridColsClass} // Apply optional class for trigger button styling
                        triggerPlaceholder={`Выберите ${config.title.toLowerCase()}`} // Example placeholder
                        // Add other UniversalDropdown props as needed (e.g., placeholder, emptySearchText)
                    />
                ))}
            </div>
        </div>
    );
}
