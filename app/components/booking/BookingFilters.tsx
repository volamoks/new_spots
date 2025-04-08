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
import CreateBookingActions from './CreateBookingActions';

const BookingFilters = () => {
    // Renamed component
    useAuth(); // Call hook if it has side effects, otherwise remove entirely if not needed
    const {
        filterCriteria, // Use filterCriteria from zonesStore
        setFilterCriteria, // Use setFilterCriteria from zonesStore
        resetFilters, // Re-add resetFilters
        uniqueFilterValues, // Use uniqueFilterValues from zonesStore
        isLoadingFilters, // Use loading state for filters from zonesStore
        fetchFilterOptions, // Use fetchFilterOptions from zonesStore
    } = useZonesStore(); // Use zonesStore hook

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

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
    ];

    return (
        <Card className="mb-6 shadow-sm">
            <CardContent className="p-6 space-y-6">
                {/* Changed title slightly */}
                <h3 className="text-lg font-semibold text-gray-800 my-6">Выбор фильтров зон</h3>

                <DropdownFilterGroup
                    groupTitle="Фильтры зон"
                    dropdowns={zoneDropdowns}
                    setFilterCriteria={setFilterCriteria} // Pass store action directly
                    isLoading={isLoadingFilters} // Use isLoadingFilters
                />
                {/* Selected Filters Display */}
                <CardContent className="p-6 space-y-6">
                    <SelectedFiltersDisplay
                        filterCriteria={filterCriteria}
                        setFilterCriteria={setFilterCriteria}
                    />
                </CardContent>

                <div className="flex justify-between pt-4">
                    <Button
                        variant="outline"
                        onClick={resetFilters} // Re-enable the onClick handler
                        disabled={isLoadingFilters} // Disable based on filters loading state
                        className="whitespace-nowrap"
                    >
                        Сбросить фильтры зон
                    </Button>
                    <CreateBookingActions />
                </div>
            </CardContent>
        </Card>
    );
};

export default BookingFilters;
