import React from 'react';
import { useZonesStore, type FilterCriteria } from '@/lib/stores/zonesStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchFilters } from './SearchFilters'; // Import the new component
import { DropdownFilterGroup } from './DropdownFilterGroup'; // Import the new component
import { SelectedFiltersDisplay } from './SelectedFiltersDisplay'; // Import the new component
import { useAuth } from '@/lib/hooks/useAuth'; // Import useAuth
// Import BookingRequestFilters type if needed for SelectedFiltersDisplay prop typing
import type { BookingRequestFilters } from '@/lib/stores/bookingRequestStore';

const BookingFilters = () => {
    const { filterCriteria, uniqueFilterValues, isLoading, setFilterCriteria, resetFilters } =
        useZonesStore();
    const { session } = useAuth(); // Get session using useAuth
    const userRole = session?.user?.role; // Extract user role

    // Destructure unique values for convenience
    const {
        cities: uniqueCities,
        markets: uniqueMarkets,
        macrozones: uniqueMacrozones, // Use uniqueMacrozones from the store directly
        equipments: uniqueEquipments,
    } = uniqueFilterValues;

    // Prepare options for dropdowns
    const cityOptions = Array.isArray(uniqueCities)
        ? uniqueCities.map(city => ({ value: city, label: city }))
        : [];
    const marketOptions = Array.isArray(uniqueMarkets)
        ? uniqueMarkets.map(market => ({ value: market, label: market }))
        : [];
    const macrozoneOptions = Array.isArray(uniqueMacrozones)
        ? uniqueMacrozones.map(macrozone => ({
              value: macrozone,
              label: macrozone,
          }))
        : [];
    const equipmentOptions = Array.isArray(uniqueEquipments)
        ? uniqueEquipments.map(equipment => ({
              value: equipment,
              label: equipment,
          }))
        : [];

    // Configuration for Zone Dropdowns
    const zoneDropdowns = [
        {
            title: 'City',
            options: cityOptions,
            selected: filterCriteria.cityFilters, // Match FilterCriteria keys
            filterKey: 'cityFilters' as keyof FilterCriteria & string,
        },
        {
            title: 'Market',
            options: marketOptions,
            selected: filterCriteria.marketFilters, // Match FilterCriteria keys
            filterKey: 'marketFilters' as keyof FilterCriteria & string,
        },
        {
            title: 'Macrozone',
            options: macrozoneOptions,
            selected: filterCriteria.macrozoneFilters, // Match FilterCriteria keys
            filterKey: 'macrozoneFilters' as keyof FilterCriteria & string,
        },
        {
            title: 'Equipment',
            options: equipmentOptions,
            selected: filterCriteria.equipmentFilters, // Match FilterCriteria keys
            filterKey: 'equipmentFilters' as keyof FilterCriteria & string,
        },
    ];

    // Handle search term change
    const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterCriteria({ searchTerm: e.target.value });
    };

    // Note: Supplier name search is omitted as it wasn't present in the original BookingFilters
    // and might not be relevant when selecting zones for a *new* booking.

    return (
        <Card className="mb-6 shadow-sm">
            <CardContent className="p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Zone Filters</h3>{' '}
                {/* TODO: i18n */}
                {/* Search Field (using SearchFilters component, but only the searchTerm part) */}
                <SearchFilters
                    searchTerm={filterCriteria.searchTerm}
                    // supplierName is not used here, pass empty string
                    supplierName=""
                    isLoading={isLoading}
                    onSearchTermChange={handleSearchTermChange}
                    // No supplier name change handler needed here
                    onSupplierNameChange={() => {}} // Provide a dummy function
                    userRole={userRole} // Pass userRole prop
                />
                {/* Zone Filters (Dropdowns) */}
                <DropdownFilterGroup
                    groupTitle="Zone Filters" // Add a title for clarity
                    dropdowns={zoneDropdowns}
                    setFilterCriteria={setFilterCriteria}
                    isLoading={isLoading}
                />
                {/* Selected Filters Display */}
                <SelectedFiltersDisplay
                    // Cast the mapped object to satisfy the prop type, adding a dummy status
                    filterCriteria={
                        {
                            city: filterCriteria.cityFilters,
                            market: filterCriteria.marketFilters,
                            macrozone: filterCriteria.macrozoneFilters,
                            equipment: filterCriteria.equipmentFilters,
                            status: [], // Add dummy status to satisfy BookingRequestFilters type
                            // Ensure other required fields from BookingRequestFilters are handled if necessary
                            // (e.g., supplierIds, dateFrom, dateTo might need dummy values if required)
                            supplierIds: [], // Add dummy supplierIds
                            dateFrom: undefined, // Add dummy dateFrom
                            dateTo: undefined, // Add dummy dateTo
                            searchTerm: filterCriteria.searchTerm, // Pass search term if SelectedFiltersDisplay uses it
                            supplierName: '', // Pass dummy supplierName
                        } as BookingRequestFilters
                    } // Explicit cast
                    setFilterCriteria={updates => {
                        // Map the keys back when updating the store, ignoring status
                        const mappedUpdates: Partial<FilterCriteria> = {};
                        // Check for existence before assigning to avoid overwriting with undefined
                        if ('city' in updates && updates.city !== undefined)
                            mappedUpdates.cityFilters = updates.city;
                        if ('market' in updates && updates.market !== undefined)
                            mappedUpdates.marketFilters = updates.market;
                        if ('macrozone' in updates && updates.macrozone !== undefined)
                            mappedUpdates.macrozoneFilters = updates.macrozone;
                        if ('equipment' in updates && updates.equipment !== undefined)
                            mappedUpdates.equipmentFilters = updates.equipment;
                        if ('searchTerm' in updates && updates.searchTerm !== undefined)
                            mappedUpdates.searchTerm = updates.searchTerm;
                        // Ignore status, supplierIds, dates, supplierName updates from SelectedFiltersDisplay
                        if (Object.keys(mappedUpdates).length > 0) {
                            setFilterCriteria(mappedUpdates);
                        }
                    }}
                />
                {/* Reset Button */}
                <div className="flex justify-end pt-4">
                    <Button
                        variant="outline"
                        onClick={resetFilters}
                        disabled={isLoading}
                        className="whitespace-nowrap"
                    >
                        Reset Filters {/* TODO: i18n */}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default BookingFilters;
