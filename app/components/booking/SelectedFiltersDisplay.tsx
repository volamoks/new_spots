import React from 'react';
import { ZoneSelectedFilters } from '@/app/components/zones/ZoneSelectedFilters';
import type { BookingRequestFilters } from '@/lib/stores/bookingRequestStore';

// Define the structure for the filters object expected by this component
// (Matches the structure passed to ZoneSelectedFilters)
type DisplayFilters = Partial<Record<string, string[]>>;

// Define the structure for the labels object
type DisplayLabels = Partial<Record<string, string>>;

// Helper to get the correct filter key in the store based on the type from ZoneSelectedFilters
type FilterDropdownKey = Exclude<
    keyof BookingRequestFilters,
    'dateFrom' | 'dateTo' | 'searchTerm' | 'supplierName' | 'supplierInn'
>;
const getFilterKeyForRemoval = (type: string): FilterDropdownKey | null => {
    if (type === 'supplier') return 'supplierIds'; // Map 'supplier' back to 'supplierIds'
    if (['status', 'city', 'market', 'macrozone', 'equipment'].includes(type)) {
        return type as FilterDropdownKey;
    }
    return null;
};

interface SelectedFiltersDisplayProps {
    filterCriteria: BookingRequestFilters; // Pass the full criteria object
    setFilterCriteria: (criteria: Partial<BookingRequestFilters>) => void; // Pass the update function
}

export const SelectedFiltersDisplay: React.FC<SelectedFiltersDisplayProps> = ({
    filterCriteria,
    setFilterCriteria,
}) => {
    // Determine if any filters are selected
    const hasSelectedFilters =
        (filterCriteria.status?.length ?? 0) > 0 ||
        (filterCriteria.supplierIds?.length ?? 0) > 0 ||
        (filterCriteria.city?.length ?? 0) > 0 ||
        (filterCriteria.market?.length ?? 0) > 0 ||
        (filterCriteria.macrozone?.length ?? 0) > 0 ||
        (filterCriteria.equipment?.length ?? 0) > 0;

    if (!hasSelectedFilters) {
        return null; // Don't render anything if no filters are selected
    }

    // Prepare filters and labels for ZoneSelectedFilters
    const displayFilters: DisplayFilters = {
        status: filterCriteria.status,
        supplier: filterCriteria.supplierIds || [], // Map supplierIds to 'supplier' key
        city: filterCriteria.city || [],
        market: filterCriteria.market || [],
        macrozone: filterCriteria.macrozone || [],
        equipment: filterCriteria.equipment || [],
    };

    const displayLabels: DisplayLabels = {
        status: 'Статус',
        supplier: 'Поставщик (ИНН)',
        city: 'Город',
        market: 'Маркет',
        macrozone: 'Макрозона',
        equipment: 'Оборудование',
    };

    // Handle removal logic
    const handleRemove = (type: string, value: string) => {
        const filterKey = getFilterKeyForRemoval(type);
        if (filterKey) {
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
