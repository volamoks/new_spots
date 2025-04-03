import React, { useEffect } from 'react'; // Removed unused useState
import {
    useBookingRequestStore, // Changed from useZonesStore
    type BookingRequestFilters, // Use BookingRequestFilters
    // Removed unused SupplierOption import
} from '@/lib/stores/bookingRequestStore'; // Import bookingRequestStore
// Removed useLoaderStore import as isLoadingOptions is now used

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
        filterCriteria, // Use filterCriteria from bookingRequestStore
        setFilterCriteria, // Use setFilterCriteria from bookingRequestStore
        resetFilters, // Use resetFilters from bookingRequestStore
        filterOptions, // Use filterOptions from bookingRequestStore
        isLoadingOptions, // Use loading state for options
        fetchFilterOptions, // Use fetchFilterOptions from bookingRequestStore
    } = useBookingRequestStore(); // Use bookingRequestStore hook

    // Use isLoadingOptions from the store instead of global loader
    // Removed unused isLoading variable assignment

    // Local state for the search input value
    // Removed localSearchTerm state, directly use filterCriteria.searchTerm if needed elsewhere

    // Removed useEffect for localSearchTerm

    // Extract unique values for zone filters from zonesStore
    // Extract options from filterOptions (bookingRequestStore)
    const {
        cities: uniqueCities,
        markets: uniqueMarkets,
        macrozones: uniqueMacrozones,
        equipments: uniqueEquipments,
        // suppliers are also available in filterOptions if needed later
    } = filterOptions;

    // Fetch filter options specifically for 'create' context on mount
    useEffect(() => {
        fetchFilterOptions('create');
    }, [fetchFilterOptions]);

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
            filterKey: 'city' as keyof BookingRequestFilters & string, // Use BookingRequestFilters keys
        },
        {
            title: 'Маркет',
            options: marketOptions,
            selected: filterCriteria.market, // Use 'market' key
            filterKey: 'market' as keyof BookingRequestFilters & string, // Use BookingRequestFilters keys
        },
        {
            title: 'Макрозона',
            options: macrozoneOptions,
            selected: filterCriteria.macrozone, // Use 'macrozone' key
            filterKey: 'macrozone' as keyof BookingRequestFilters & string, // Use BookingRequestFilters keys
        },
        {
            title: 'Оборудование',
            options: equipmentOptions,
            selected: filterCriteria.equipment, // Use 'equipment' key
            filterKey: 'equipment' as keyof BookingRequestFilters & string, // Use BookingRequestFilters keys
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
                    isLoading={isLoadingOptions}
                />
                {/* Selected Filters Display */}
                <SelectedFiltersDisplay
                    // Pass filterCriteria directly from useBookingRequestStore
                    filterCriteria={filterCriteria}
                    // Pass setFilterCriteria directly from useBookingRequestStore
                    setFilterCriteria={setFilterCriteria}
                />
                {/* Reset Button */}
                <div className="flex justify-end pt-4">
                    <Button
                        variant="outline"
                        onClick={resetFilters}
                        disabled={isLoadingOptions} // Disable based on options loading state
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
