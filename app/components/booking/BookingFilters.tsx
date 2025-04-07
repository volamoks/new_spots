import React, { useEffect } from 'react'; // Removed unused useState
import {
    useZonesStore, // Use zonesStore
    type FilterCriteria, // Use FilterCriteria type from zonesStore
    // Removed unused SupplierOption import
} from '@/lib/stores/zonesStore'; // Import zonesStore
// Removed unused useLoaderStore import

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
// Removed DateRangeFilter import

import { DropdownFilterGroup } from './DropdownFilterGroup';
import { SelectedFiltersDisplay } from './SelectedFiltersDisplay';
// Removed redundant import

// Removed translateStatus helper as status filter is removed

const BookingFilters = () => {
    // Renamed component
    // Removed unused user from useAuth()
    useAuth(); // Call hook if it has side effects, otherwise remove entirely if not needed
    const {
        filterCriteria, // Use filterCriteria from zonesStore
        setFilterCriteria, // Use setFilterCriteria from zonesStore
        resetFilters, // Re-add resetFilters
        uniqueFilterValues, // Use uniqueFilterValues from zonesStore
        isLoadingFilters, // Use loading state for filters from zonesStore
        fetchFilterOptions, // Use fetchFilterOptions from zonesStore
    } = useZonesStore(); // Use zonesStore hook

    // Use isLoadingOptions from the store instead of global loader
    // Removed unused isLoading variable assignment

    // Local state for the search input value
    // Removed localSearchTerm state, directly use filterCriteria.searchTerm if needed elsewhere

    // Removed useEffect for localSearchTerm

    // Extract unique values for zone filters from zonesStore
    // Extract options from uniqueFilterValues (zonesStore)
    // Access directly from uniqueFilterValues to preserve types
    // const {
    //     cities: uniqueCities,
    //     markets: uniqueMarkets,
    //     macrozones: uniqueMacrozones,
    //     equipments: uniqueEquipments,
    // } = uniqueFilterValues; // Keep commented or remove if direct access is used below

    // Fetch filter options specifically for 'create' context on mount
    useEffect(() => {
        // fetchFilterOptions might not need 'create' context when using zonesStore
        // Check zonesStore implementation if context is needed
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    // Removed statusOptions

    // Options for zone filters
    // Use uniqueFilterValues directly to map options
    const cityOptions = uniqueFilterValues.cities.map(city => ({ value: city, label: city }));
    const marketOptions = uniqueFilterValues.markets.map(market => ({
        value: market,
        label: market,
    }));
    const macrozoneOptions = uniqueFilterValues.macrozones.map(macrozone => ({
        value: macrozone,
        label: macrozone,
    }));
    const equipmentOptions = uniqueFilterValues.equipments.map(equipment => ({
        value: equipment,
        label: equipment,
    }));

    // Removed supplierOptions

    // Removed mainDropdowns (Status, Supplier)

    // Configuration for Zone Dropdowns (using keys from useZonesStore)
    const zoneDropdowns = [
        {
            title: 'Город',
            options: cityOptions,
            selected: filterCriteria.city, // Use 'city' key
            filterKey: 'city' as keyof FilterCriteria & string, // Use FilterCriteria keys
        },
        {
            title: 'Маркет',
            options: marketOptions,
            selected: filterCriteria.market, // Use 'market' key
            filterKey: 'market' as keyof FilterCriteria & string, // Use FilterCriteria keys
        },
        {
            title: 'Макрозона',
            options: macrozoneOptions,
            selected: filterCriteria.macrozone, // Use 'macrozone' key
            filterKey: 'macrozone' as keyof FilterCriteria & string, // Use FilterCriteria keys
        },
        {
            title: 'Оборудование',
            options: equipmentOptions,
            selected: filterCriteria.equipment, // Use 'equipment' key
            filterKey: 'equipment' as keyof FilterCriteria & string, // Use FilterCriteria keys
        },
        // Removed supplier dropdown from here
    ];

    return (
        <Card className="mb-6 shadow-sm">
            <CardContent className="p-6 space-y-6">
                {/* Changed title slightly */}
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Выбор фильтров зон</h3>

                <DropdownFilterGroup
                    groupTitle="Фильтры зон"
                    dropdowns={zoneDropdowns}
                    setFilterCriteria={setFilterCriteria} // Pass store action directly
                    // Use isLoadingOptions from the store
                    isLoading={isLoadingFilters} // Use isLoadingFilters
                />
                {/* Selected Filters Display */}
                <SelectedFiltersDisplay
                    // Pass filterCriteria (type FilterCriteria) from useZonesStore
                    filterCriteria={filterCriteria}
                    // Pass setFilterCriteria from useZonesStore
                    setFilterCriteria={setFilterCriteria}
                    // Note: SelectedFiltersDisplay might need internal adjustments
                    // if it strictly expects BookingRequestFilters type.
                />
                {/* Reset Button */}
                <div className="flex justify-end pt-4">
                    <Button
                        variant="outline"
                        onClick={resetFilters} // Re-enable the onClick handler
                        disabled={isLoadingFilters} // Disable based on filters loading state
                        className="whitespace-nowrap"
                    >
                        {/* Changed button text slightly */}
                        Сбросить фильтры зон
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default BookingFilters;
