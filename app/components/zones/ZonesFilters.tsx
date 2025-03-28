'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ZoneFilterTabs } from './ZoneFilterTabs';
import { ZoneSearchInput } from './ZoneSearchInput';
import { SimpleZoneFilterDropdown } from './SimpleZoneFilterDropdown';
import { ZoneSelectedFilters } from './ZoneSelectedFilters';
import { RefreshCw } from 'lucide-react';
import { getCorrespondingMacrozones } from '@/lib/filterData';
import { useDmpManagerZones } from '@/lib/stores/zones/dmpManagerZonesStore'; // Import the store

// Define valid filter types used for dropdowns in this component
type DropdownFilterType = 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier';

// --- Simplified Props ---
interface ZonesFiltersProps {
    // Keep handlers with custom logic in parent or passed to children
    onFilterChange: (
        type: DropdownFilterType, // Use defined DropdownFilterType
        values: string[],
    ) => void;
    // onFilterRemove prop removed - handled internally via store

    // Configuration props
    role?: string;
    className?: string;
    selectedCategory?: string | null; // Keep for macrozone filtering logic
}
export function ZonesFilters({
    // Keep necessary props
    onFilterChange,
    role = 'DMP_MANAGER',
    className = '',
    selectedCategory = null, // Keep for macrozone filtering logic
}: ZonesFiltersProps) {
    // --- Get State and Actions from Store ---
    const {
        // State objects from the primary zonesStore
        filterCriteria, // Contains activeTab, searchTerm, cityFilters, etc.
        uniqueFilterValues, // Contains uniqueCities, uniqueMarkets, etc.
        isLoading,

        // Actions from the primary zonesStore
        setFilterCriteria, // Use this to update filters
        resetFilters,

        // Actions from dmpManagerActionsStore (via the hook)
        refreshZones,
        // Removed setSearchTerm, will use setFilterCriteria
    } = useDmpManagerZones();

    // Destructure further for convenience
    const {
        activeTab,
        searchTerm,
        cityFilters,
        marketFilters,
        macrozoneFilters,
        equipmentFilters,
        supplierFilters,
    } = filterCriteria;
    // Rename properties during destructuring
    const {
        cities: uniqueCities,
        markets: uniqueMarkets,
        macrozones: uniqueMacrozones,
        equipments: uniqueEquipments,
        suppliers: uniqueSuppliers,
    } = uniqueFilterValues;

    // --- Options for Dropdowns (logic remains the same) ---
    const cityOptions = Array.isArray(uniqueCities)
        ? uniqueCities.map(city => ({ value: city, label: city }))
        : [];
    const marketOptions = Array.isArray(uniqueMarkets)
        ? uniqueMarkets.map(market => ({ value: market, label: market }))
        : [];
    const macrozoneOptions = selectedCategory
        ? getCorrespondingMacrozones(selectedCategory).map(macrozone => ({
              value: macrozone,
              label: macrozone,
          }))
        : Array.isArray(uniqueMacrozones)
        ? uniqueMacrozones.map(macrozone => ({ value: macrozone, label: macrozone }))
        : [];
    const equipmentOptions = Array.isArray(uniqueEquipments)
        ? uniqueEquipments.map(equipment => ({ value: equipment, label: equipment }))
        : [];
    const supplierOptions = Array.isArray(uniqueSuppliers)
        ? uniqueSuppliers.map(supplier => ({ value: supplier, label: supplier }))
        : [];

    // --- Construct filters object for ZoneSelectedFilters ---
    // Use string keys to match ZoneSelectedFilters expectation
    const selectedFiltersForDisplay: Partial<Record<string, string[]>> = {
        city: cityFilters,
        market: marketFilters,
        macrozone: macrozoneFilters,
        equipment: equipmentFilters,
        supplier: supplierFilters,
    };

    // --- Filter Labels (logic remains the same) ---
    // Use string keys to match ZoneSelectedFilters expectation
    const filterLabels: Partial<Record<string, string>> = {
        city: 'Город',
        market: 'Магазин',
        macrozone: 'Макрозона',
        equipment: 'Оборудование',
        supplier: 'Поставщик',
    };

    // --- Handle Filter Removal ---
    // Accept 'type' as string to match ZoneSelectedFilters onRemove prop
    const handleRemoveFilter = (type: string, valueToRemove: string) => {
        // Map the string type to the corresponding key in filterCriteria
        const filterKey = `${type}Filters` as keyof typeof filterCriteria; // e.g., 'cityFilters'

        // Check if the key is valid before proceeding
        if (!(filterKey in filterCriteria)) {
            console.warn(`Invalid filter type received for removal: ${type}`);
            return;
        }

        // Get the current array from the store's state
        const currentValues = filterCriteria[filterKey] as string[] | undefined;

        if (Array.isArray(currentValues)) {
            // Filter out the value
            const newValues = currentValues.filter(value => value !== valueToRemove);
            // Update the store
            setFilterCriteria({ [filterKey]: newValues });
        }
    };


    // --- Render ---
    return (
        <Card className={className}>
            <CardContent className="p-4 space-y-4">
                {/* Tabs - Use store state/action */}
                <ZoneFilterTabs
                    activeTab={activeTab}
                    onTabChange={tab => setFilterCriteria({ activeTab: tab })} // Use setFilterCriteria
                    isDisabled={isLoading}
                    role={role} // Keep role prop
                    className="mb-4"
                />

                {/* Search and Actions - Use store state/actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <ZoneSearchInput
                            value={searchTerm}
                            // Use setFilterCriteria to update the search term
                            onChange={(value) => setFilterCriteria({ searchTerm: value })}
                            isDisabled={isLoading}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={resetFilters} // Use store action
                            disabled={isLoading}
                            className="whitespace-nowrap"
                        >
                            Сбросить фильтры
                        </Button>
                        <Button
                            onClick={refreshZones} // Use store action
                            disabled={isLoading}
                            className="whitespace-nowrap"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Обновить
                        </Button>
                    </div>
                </div>

                {/* Dropdowns - Use store state, keep onFilterChange prop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    <SimpleZoneFilterDropdown
                        title="Город"
                        options={cityOptions}
                        selected={cityFilters}
                        onChange={(values: string[]) => onFilterChange('city', values)} // Keep prop
                        isDisabled={isLoading}
                    />
                    <SimpleZoneFilterDropdown
                        title="Магазин"
                        options={marketOptions}
                        selected={marketFilters}
                        onChange={(values: string[]) => onFilterChange('market', values)} // Keep prop
                        isDisabled={isLoading}
                    />
                    <SimpleZoneFilterDropdown
                        title="Макрозона"
                        options={macrozoneOptions}
                        selected={macrozoneFilters}
                        onChange={(values: string[]) => onFilterChange('macrozone', values)} // Keep prop
                        isDisabled={isLoading}
                    />
                    <SimpleZoneFilterDropdown
                        title="Оборудование"
                        options={equipmentOptions}
                        selected={equipmentFilters}
                        onChange={(values: string[]) => onFilterChange('equipment', values)} // Keep prop
                        isDisabled={isLoading}
                    />
                    {role !== 'SUPPLIER' && (
                        <SimpleZoneFilterDropdown
                            title="Поставщик"
                            options={supplierOptions}
                            selected={supplierFilters}
                            onChange={(values: string[]) => onFilterChange('supplier', values)} // Keep prop
                            isDisabled={isLoading}
                        />
                    )}
                </div>

                {/* Selected Filters - Pass constructed filters and remove handler */}
                <ZoneSelectedFilters
                    filters={selectedFiltersForDisplay} // Pass the filters object
                    labels={filterLabels}
                    onRemove={handleRemoveFilter} // Pass the remove handler (now accepts string type)
                />
            </CardContent>
        </Card>
    );
}
