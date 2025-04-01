'use client';

import React, { useCallback } from 'react'; // Import useCallback
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ZoneFilterTabs } from './ZoneFilterTabs';
import { RefreshCw } from 'lucide-react';
import { getCorrespondingMacrozones } from '@/lib/filterData';
// Use the base store hook
import { useZonesStore } from '@/lib/stores/zonesStore';
import type { FilterCriteria as ZonesFilterCriteria } from '@/lib/stores/zonesStore';

// Import the common filter components
import { SearchFilters } from '@/app/components/booking/SearchFilters';
import { DropdownFilterGroup } from '@/app/components/booking/DropdownFilterGroup';
import { SelectedFiltersDisplay } from '@/app/components/booking/SelectedFiltersDisplay';
import type { BookingRequestFilters } from '@/lib/stores/bookingRequestStore';

interface ZonesFiltersProps {
    role?: string;
    className?: string;
    selectedCategory?: string | null;
}
export function ZonesFilters({
    role = 'DMP_MANAGER',
    className = '',
    selectedCategory = null,
}: ZonesFiltersProps) {
    // Use the base store hook
    const {
        filterCriteria,
        uniqueFilterValues,
        isLoading,
        setFilterCriteria, // Use this directly
        resetFilters,
        fetchZones,
    } = useZonesStore();

    // Destructure filter criteria and unique values
    const {
        activeTab,
        searchTerm,
        cityFilters,
        marketFilters,
        macrozoneFilters,
        equipmentFilters,
        supplierFilters,
    } = filterCriteria;
    const {
        cities: uniqueCities,
        markets: uniqueMarkets,
        macrozones: uniqueMacrozones,
        equipments: uniqueEquipments,
        suppliers: uniqueSuppliers,
    } = uniqueFilterValues;

    // --- Options for Dropdowns ---
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

    // --- Configuration for Dropdowns ---
    // Use filter keys expected by DropdownFilterGroup (likely from BookingRequestFilters)
    const dropdownConfigs = [
        { title: 'City', options: cityOptions, selected: cityFilters, filterKey: 'city' as const },
        {
            title: 'Market',
            options: marketOptions,
            selected: marketFilters,
            filterKey: 'market' as const,
        },
        {
            title: 'Macrozone',
            options: macrozoneOptions,
            selected: macrozoneFilters,
            filterKey: 'macrozone' as const,
        },
        {
            title: 'Equipment',
            options: equipmentOptions,
            selected: equipmentFilters,
            filterKey: 'equipment' as const,
        },
        ...(role !== 'SUPPLIER'
            ? [
                  {
                      title: 'Supplier',
                      options: supplierOptions,
                      selected: supplierFilters,
                      filterKey: 'supplierIds' as const,
                  },
              ] // Map to supplierIds
            : []),
    ];

    // --- Handlers ---

    // Handler for simple text search
    const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterCriteria({ searchTerm: e.target.value });
    };

    // REMOVED handleDropdownChange - Pass setFilterCriteria directly, mapping happens in child
    // REMOVED handleFilterRemove - Pass setFilterCriteria directly, mapping happens in child

    // --- Render ---
    return (
        <Card className={className}>
            <CardContent className="p-4 space-y-4">
                {/* Tabs */}
                <ZoneFilterTabs
                    activeTab={activeTab}
                    onTabChange={tab => setFilterCriteria({ activeTab: tab })}
                    isDisabled={isLoading}
                    role={role}
                    className="mb-4"
                />

                {/* Search and Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <SearchFilters
                            searchTerm={searchTerm}
                            supplierName="" // Not used here
                            isLoading={isLoading}
                            onSearchTermChange={handleSearchTermChange}
                            onSupplierNameChange={() => {}} // Dummy handler
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={resetFilters}
                            disabled={isLoading}
                            className="whitespace-nowrap"
                        >
                            Reset Filters
                        </Button>
                        <Button
                            onClick={fetchZones}
                            disabled={isLoading}
                            className="whitespace-nowrap"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Dropdowns */}
                <DropdownFilterGroup
                    groupTitle="Filters"
                    dropdowns={dropdownConfigs}
                    // Pass setFilterCriteria directly - DropdownFilterGroup needs to handle mapping if keys differ
                    // It seems DropdownFilterGroup passes the key directly to its child SimpleZoneFilterDropdown,
                    // which then calls setFilterCriteria with { [filterKey]: values }.
                    // So, the mapping needs to happen HERE before passing setFilterCriteria, or inside SimpleZoneFilterDropdown.
                    // Let's assume SimpleZoneFilterDropdown handles it or expects the store's keys.
                    // Reverting dropdownConfigs keys back to store keys.
                    // setFilterCriteria={setFilterCriteria} // Pass the original store action
                    // UPDATE: Memoize the wrapper function passed to setFilterCriteria prop
                    // Explicitly type 'update' to match expected input from DropdownFilterGroup
                    setFilterCriteria={useCallback(
                        (update: Partial<BookingRequestFilters>) => {
                            // Map keys from BookingRequestFilters (used by DropdownGroup/SimpleDropdown) back to ZonesFilterCriteria
                            const mappedUpdate: Partial<ZonesFilterCriteria> = {};
                            if ('city' in update && update.city !== undefined)
                                mappedUpdate.cityFilters = update.city;
                            if ('market' in update && update.market !== undefined)
                                mappedUpdate.marketFilters = update.market;
                            if ('macrozone' in update && update.macrozone !== undefined)
                                mappedUpdate.macrozoneFilters = update.macrozone;
                            if ('equipment' in update && update.equipment !== undefined)
                                mappedUpdate.equipmentFilters = update.equipment;
                            if ('supplierIds' in update && update.supplierIds !== undefined)
                                mappedUpdate.supplierFilters = update.supplierIds;
                            // Pass through other potential updates directly if keys match, with type checks
                            if ('searchTerm' in update && typeof update.searchTerm === 'string')
                                mappedUpdate.searchTerm = update.searchTerm;
                            if ('activeTab' in update && typeof update.activeTab === 'string')
                                mappedUpdate.activeTab = update.activeTab;

                            if (Object.keys(mappedUpdate).length > 0) {
                                setFilterCriteria(mappedUpdate);
                            }
                        },
                        [setFilterCriteria],
                    )} // Add setFilterCriteria to useCallback dependency array
                    isLoading={isLoading}
                />

                {/* Selected Filters */}
                <SelectedFiltersDisplay
                    // Map store criteria to the structure expected by SelectedFiltersDisplay
                    filterCriteria={
                        {
                            city: cityFilters,
                            market: marketFilters,
                            macrozone: macrozoneFilters,
                            equipment: equipmentFilters,
                            supplierIds: supplierFilters, // Map supplierFilters to supplierIds
                            status: [], // Dummy value
                            dateFrom: undefined, // Dummy value
                            dateTo: undefined, // Dummy value
                            searchTerm: searchTerm,
                            supplierName: '', // Dummy value
                        } as BookingRequestFilters
                    } // Cast needed
                    // Pass setFilterCriteria directly - SelectedFiltersDisplay handles mapping internally via getFilterKeyForRemoval
                    setFilterCriteria={setFilterCriteria}
                />
            </CardContent>
        </Card>
    );
}
