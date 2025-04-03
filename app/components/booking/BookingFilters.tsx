import React from 'react';
import { useZonesStore, type FilterCriteria } from '@/lib/stores/zonesStore';
import { useLoaderStore } from '@/lib/stores/loaderStore'; // Import loader store
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchFilters } from './SearchFilters'; // Import the new component
import { DropdownFilterGroup } from './DropdownFilterGroup'; // Import the new component
import { SelectedFiltersDisplay } from './SelectedFiltersDisplay'; // Import the new component
import { useAuth } from '@/lib/hooks/useAuth'; // Import useAuth
// Import BookingRequestFilters type if needed for SelectedFiltersDisplay prop typing
import type { BookingRequestFilters } from '@/lib/stores/bookingRequestStore';

const BookingFilters = () => {
    // Get non-loading state/actions from zones store
    const { filterCriteria, uniqueFilterValues, setFilterCriteria, resetFilters } = useZonesStore();
    // Get loading state from global loader store
    const isLoading = useLoaderStore(state => state.isLoading);
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
            title: 'Город',
            options: cityOptions,
            selected: filterCriteria.city, // Use new key 'city'
            filterKey: 'city' as keyof FilterCriteria & string, // Use new key 'city'
        },
        {
            title: 'Маркет',
            options: marketOptions,
            selected: filterCriteria.market, // Use new key 'market'
            filterKey: 'market' as keyof FilterCriteria & string, // Use new key 'market'
        },
        {
            title: 'Макрозона',
            options: macrozoneOptions,
            selected: filterCriteria.macrozone, // Use new key 'macrozone'
            filterKey: 'macrozone' as keyof FilterCriteria & string, // Use new key 'macrozone'
        },
        {
            title: 'Оборудование',
            options: equipmentOptions,
            selected: filterCriteria.equipment, // Use new key 'equipment'
            filterKey: 'equipment' as keyof FilterCriteria & string, // Use new key 'equipment'
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
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Выбор фильтров зон</h3>{' '}
                {/* TODO: i18n */}
                {/* Search Field (using SearchFilters component, but only the searchTerm part) */}
                <SearchFilters
                    searchTerm={filterCriteria.searchTerm}
                    // supplierName is not used here, pass empty string
                    supplierName=""
                    isLoading={isLoading} // Use global isLoading
                    onSearchTermChange={handleSearchTermChange}
                    // No supplier name change handler needed here
                    onSupplierNameChange={() => {}} // Provide a dummy function
                    userRole={userRole} // Pass userRole prop
                />
                {/* Zone Filters (Dropdowns) */}
                <DropdownFilterGroup
                    groupTitle="Фильтры зон" // Add a title for clarity
                    dropdowns={zoneDropdowns}
                    setFilterCriteria={setFilterCriteria}
                    isLoading={isLoading} // Use global isLoading
                />
                {/* Selected Filters Display */}
                <SelectedFiltersDisplay
                    // Pass the relevant parts of filterCriteria directly
                    // Note: SelectedFiltersDisplay expects BookingRequestFilters type,
                    // but we are using it with FilterCriteria from useZonesStore.
                    // This might require adjusting SelectedFiltersDisplay or creating a variant.
                    // For now, we cast, assuming the relevant keys match.
                    filterCriteria={
                        {
                            ...filterCriteria,
                            // Add dummy fields expected by BookingRequestFilters but not in FilterCriteria
                            status: [],
                            supplierIds: filterCriteria.supplier || [], // Map 'supplier' from store to 'supplierIds'
                            dateFrom: undefined,
                            dateTo: undefined,
                            supplierName: '',
                        } as BookingRequestFilters // Cast needed due to type mismatch
                    }
                    // Pass the store's setFilterCriteria directly
                    setFilterCriteria={
                        setFilterCriteria as (criteria: Partial<BookingRequestFilters>) => void
                    } // Cast needed due to type mismatch
                />
                {/* Reset Button */}
                <div className="flex justify-end pt-4">
                    <Button
                        variant="outline"
                        onClick={resetFilters}
                        disabled={isLoading} // Use global isLoading
                        className="whitespace-nowrap"
                    >
                        Сбросить фильтры
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default BookingFilters;
