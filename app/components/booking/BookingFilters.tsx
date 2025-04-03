import React, { useEffect, useState } from 'react'; // Import useState and useCallback
import {
    useZonesStore,
    type FilterCriteria, // Use FilterCriteria from zonesStore
} from '@/lib/stores/zonesStore'; // Import zonesStore
import { useLoaderStore } from '@/lib/stores/loaderStore';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
// Removed DateRangeFilter import

import { DropdownFilterGroup } from './DropdownFilterGroup';
import { SelectedFiltersDisplay } from './SelectedFiltersDisplay';
// Import BookingRequestFilters only for casting if SelectedFiltersDisplay strictly requires it
import type { BookingRequestFilters } from '@/lib/stores/bookingRequestStore';

// Removed translateStatus helper as status filter is removed

const BookingFilters = () => {
    // Renamed component
    const { user } = useAuth();
    const {
        filterCriteria,
        setFilterCriteria,
        resetFilters,
        fetchZones, // Use fetchZones from zonesStore
        uniqueFilterValues,
    } = useZonesStore(); // Use zonesStore hook

    const isLoading = useLoaderStore(state => state.isLoading);

    // Local state for the search input value
    const [localSearchTerm, setLocalSearchTerm] = useState(filterCriteria.searchTerm || '');

    // Update local state if store state changes externally
    useEffect(() => {
        setLocalSearchTerm(filterCriteria.searchTerm || '');
    }, [filterCriteria.searchTerm]);

    // Extract unique values for zone filters from zonesStore
    const {
        // suppliers: uniqueSuppliers, // Removed supplier dropdown data
        cities: uniqueCities,
        markets: uniqueMarkets,
        macrozones: uniqueMacrozones,
        equipments: uniqueEquipments,
        // statuses: uniqueStatuses, // Removed status data
    } = uniqueFilterValues;

    // Fetch zones on component mount (or when needed)
    // Note: CreateBookingPage already calls fetchZones and fetchFilterOptions,
    // so this might be redundant depending on exact usage context.
    // Consider removing if CreateBookingPage handles initial fetch.
    useEffect(() => {
        // fetchZones(); // Potentially redundant, called by parent
    }, [fetchZones]);

    // Removed statusOptions

    // Options for zone filters
    const cityOptions = uniqueCities.map(city => ({ value: city, label: city }));
    const marketOptions = uniqueMarkets.map(market => ({ value: market, label: market }));
    const macrozoneOptions = uniqueMacrozones.map(macrozone => ({
        value: macrozone,
        label: macrozone,
    }));
    const equipmentOptions = uniqueEquipments.map(equipment => ({
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
            filterKey: 'city' as keyof FilterCriteria & string,
        },
        {
            title: 'Маркет',
            options: marketOptions,
            selected: filterCriteria.market, // Use 'market' key
            filterKey: 'market' as keyof FilterCriteria & string,
        },
        {
            title: 'Макрозона',
            options: macrozoneOptions,
            selected: filterCriteria.macrozone, // Use 'macrozone' key
            filterKey: 'macrozone' as keyof FilterCriteria & string,
        },
        {
            title: 'Оборудование',
            options: equipmentOptions,
            selected: filterCriteria.equipment, // Use 'equipment' key
            filterKey: 'equipment' as keyof FilterCriteria & string,
        },
        // Removed supplier dropdown from here
    ];

    return (
        <Card className="mb-6 shadow-sm">
            <CardContent className="p-6 space-y-6">
                {/* Changed title slightly */}
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Выбор фильтров зон</h3>
                {/* Removed Date Filters */}
                {/* Search Fields */}
                {/* <SearchFilters
                    searchTerm={localSearchTerm} // Use local state for input value
                    // Pass supplierName if needed, otherwise empty string or null
                    // Assuming supplierName is not part of zonesStore filterCriteria
                    supplierName={''} // Or filterCriteria.supplierName if added to store
                    isLoading={isLoading}
                    onSearchTermChange={handleSearchTermChange}
                    // Removed onSupplierNameChange prop as it's not used here
                    onSupplierNameChange={() => {}} // Keep a dummy prop if SearchFilters requires it
                    userRole={user?.role}
                /> */}
                {/* Removed Main Filters (Status, Supplier Dropdowns) */}
                {/* Zone Filters (Dropdowns) */}
                <DropdownFilterGroup
                    groupTitle="Фильтры зон"
                    dropdowns={zoneDropdowns}
                    setFilterCriteria={setFilterCriteria} // Pass store action directly
                    isLoading={isLoading}
                />
                {/* Selected Filters Display */}
                <SelectedFiltersDisplay
                    // Cast the relevant parts of filterCriteria from useZonesStore
                    // to satisfy the BookingRequestFilters type expected by SelectedFiltersDisplay.
                    // This relies on the overlapping keys (city, market, etc.) having the same meaning.
                    filterCriteria={
                        {
                            // Map keys from useZonesStore FilterCriteria
                            city: filterCriteria.city,
                            market: filterCriteria.market,
                            macrozone: filterCriteria.macrozone,
                            equipment: filterCriteria.equipment,
                            supplierIds: filterCriteria.supplier || [], // Map 'supplier' to 'supplierIds'
                            searchTerm: filterCriteria.searchTerm,
                            // Add dummy fields expected by BookingRequestFilters
                            status: [],
                            dateFrom: undefined,
                            dateTo: undefined,
                            supplierName: '', // Assuming not used here
                        } as BookingRequestFilters // Cast needed
                    }
                    // Pass the store's setFilterCriteria directly, casting the type
                    setFilterCriteria={
                        setFilterCriteria as (criteria: Partial<BookingRequestFilters>) => void
                    }
                />
                {/* Reset Button */}
                <div className="flex justify-end pt-4">
                    <Button
                        variant="outline"
                        onClick={resetFilters}
                        disabled={isLoading}
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
