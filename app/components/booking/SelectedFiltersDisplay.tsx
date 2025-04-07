import React from 'react';
import { ZoneSelectedFilters } from '@/app/components/zones/ZoneSelectedFilters';
import type { FilterCriteria } from '@/lib/stores/zonesStore'; // Import FilterCriteria from zonesStore

// Define the structure for the filters object expected by this component
// (Matches the structure passed to ZoneSelectedFilters)
type DisplayFilters = Partial<Record<string, string[]>>;

// Define the structure for the labels object
type DisplayLabels = Partial<Record<string, string>>;

// Helper to get the correct filter key in the store based on the type from ZoneSelectedFilters
// Update helper to use FilterCriteria keys
type FilterDropdownKey = Exclude<
    keyof FilterCriteria,
    'searchTerm' | 'activeTab' | 'category' // Exclude non-array filters
>;
const getFilterKeyForRemoval = (type: string): FilterDropdownKey | null => {
    // Map display type directly to FilterCriteria key
    if (['city', 'market', 'macrozone', 'equipment', 'supplier'].includes(type)) {
        return type as FilterDropdownKey;
    }
    return null;
};

interface SelectedFiltersDisplayProps {
    filterCriteria: FilterCriteria; // Use FilterCriteria type
    setFilterCriteria: (criteria: Partial<FilterCriteria>) => void; // Expect FilterCriteria update function
}

export const SelectedFiltersDisplay: React.FC<SelectedFiltersDisplayProps> = ({
    filterCriteria,
    setFilterCriteria,
}) => {
    // Determine if any filters are selected
    const hasSelectedFilters =
        // Check based on FilterCriteria properties (excluding activeTab and searchTerm)
        (filterCriteria.supplier?.length ?? 0) > 0 ||
        (filterCriteria.city?.length ?? 0) > 0 ||
        (filterCriteria.market?.length ?? 0) > 0 ||
        (filterCriteria.macrozone?.length ?? 0) > 0 ||
        (filterCriteria.equipment?.length ?? 0) > 0;

    if (!hasSelectedFilters) {
        return null; // Don't render anything if no filters are selected
    }

    // Prepare filters and labels for ZoneSelectedFilters
    // Prepare filters using FilterCriteria properties
    const displayFilters: DisplayFilters = {
        // status: filterCriteria.status, // Remove status, activeTab is not displayed here
        supplier: filterCriteria.supplier || [], // Use 'supplier' key directly
        city: filterCriteria.city || [],
        market: filterCriteria.market || [],
        macrozone: filterCriteria.macrozone || [],
        equipment: filterCriteria.equipment || [],
    };

    // Update labels (remove status, adjust supplier if needed)
    const displayLabels: DisplayLabels = {
        // status: 'Статус', // Remove status label
        supplier: 'Поставщик', // Use 'Поставщик' as label (supplier filter in zonesStore might be name/ID, not INN)
        city: 'Город',
        market: 'Маркет',
        macrozone: 'Макрозона',
        equipment: 'Оборудование',
    };

    // Handle removal logic
    const handleRemove = (type: string, value: string) => {
        const filterKey = getFilterKeyForRemoval(type);
        if (filterKey) {
            // Type assertion ensures compatibility with FilterCriteria structure
            const currentValues = filterCriteria[filterKey] as string[] | undefined;
            const newValues = currentValues?.filter(v => v !== value) || [];
            setFilterCriteria({ [filterKey]: newValues });
        }
    };

    return (
        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Выбранные фильтры</h4>
            <ZoneSelectedFilters
                filters={displayFilters}
                labels={displayLabels}
                onRemove={handleRemove}
                className="mt-2 flex flex-wrap gap-2"
            />
        </div>
    );
};
