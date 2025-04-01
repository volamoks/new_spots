import React from 'react';
import { SimpleZoneFilterDropdown } from '@/app/components/zones/SimpleZoneFilterDropdown';
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
                    <SimpleZoneFilterDropdown
                        key={config.filterKey}
                        title={config.title} /* TODO: i18n */
                        options={config.options}
                        selected={config.selected || []} // Ensure array
                        filterKey={config.filterKey}
                        setFilterCriteria={setFilterCriteria}
                        isDisabled={isLoading}
                        className={config.gridColsClass} // Apply optional class
                    />
                ))}
            </div>
        </div>
    );
}
