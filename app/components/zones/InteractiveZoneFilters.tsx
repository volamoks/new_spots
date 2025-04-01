// app/components/zones/InteractiveZoneFilters.tsx
'use client';

import React, { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useZonesStore } from '@/lib/stores/zonesStore';
import type { FilterCriteria as ZonesFilterCriteria } from '@/lib/stores/zonesStore';
import type { BookingRequestFilters } from '@/lib/stores/bookingRequestStore';
import { getCorrespondingMacrozones } from '@/lib/filterData';
import { DropdownFilterGroup } from '@/app/components/booking/DropdownFilterGroup';
import { SelectedFiltersDisplay } from '@/app/components/booking/SelectedFiltersDisplay';

interface InteractiveZoneFiltersProps {
    // Optional prop if category selection affects macrozone options outside the store
    selectedCategory?: string | null;
}

export function InteractiveZoneFilters({ selectedCategory = null }: InteractiveZoneFiltersProps) {
    const { data: session } = useSession();
    const role = session?.user?.role;

    const { filterCriteria, uniqueFilterValues, isLoading, setFilterCriteria } = useZonesStore();

    const {
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

    // --- Options for Dropdowns (Logic moved from ZonesFilters) ---
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

    const dropdownConfigs = [
        { title: 'Город', options: cityOptions, selected: cityFilters, filterKey: 'city' as const },
        {
            title: 'Маркет',
            options: marketOptions,
            selected: marketFilters,
            filterKey: 'market' as const,
        },
        {
            title: 'Макрозона',
            options: macrozoneOptions,
            selected: macrozoneFilters,
            filterKey: 'macrozone' as const,
        },
        {
            title: 'Оборудование',
            options: equipmentOptions,
            selected: equipmentFilters,
            filterKey: 'equipment' as const,
        },
        ...(role !== 'SUPPLIER'
            ? [
                  {
                      title: 'Поставщик',
                      options: supplierOptions,
                      selected: supplierFilters,
                      filterKey: 'supplierIds' as const,
                  },
              ] // Map to supplierIds
            : []),
    ];

    // --- Internal Handler for Setting Filters (Logic moved from ZonesFilters) ---
    const handleSetFilter = useCallback(
        (update: Partial<BookingRequestFilters>) => {
            // Map keys from BookingRequestFilters back to ZonesFilterCriteria
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
            // Pass through other potential updates directly if keys match
            if ('searchTerm' in update && typeof update.searchTerm === 'string')
                mappedUpdate.searchTerm = update.searchTerm;
            if ('activeTab' in update && typeof update.activeTab === 'string')
                mappedUpdate.activeTab = update.activeTab;

            if (Object.keys(mappedUpdate).length > 0) {
                setFilterCriteria(mappedUpdate);
            }
        },
        [setFilterCriteria],
    );

    // --- Prepare filterCriteria for SelectedFiltersDisplay (Logic moved from ZonesFilters) ---
    const displayFilterCriteria: BookingRequestFilters = {
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
    };

    return (
        <div className="space-y-4">
            <DropdownFilterGroup
                groupTitle="Фильтры"
                dropdowns={dropdownConfigs}
                setFilterCriteria={handleSetFilter} // Use internal handler
                isLoading={isLoading}
            />
            <SelectedFiltersDisplay
                filterCriteria={displayFilterCriteria} // Use prepared criteria
                // Pass the main store setter - SelectedFiltersDisplay handles mapping internally via getFilterKeyForRemoval
                setFilterCriteria={setFilterCriteria}
            />
        </div>
    );
}
