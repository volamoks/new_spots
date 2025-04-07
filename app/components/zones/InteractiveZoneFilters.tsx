// app/components/zones/InteractiveZoneFilters.tsx
'use client';

import React, { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRoleData } from '@/lib/stores/roleActionsStore'; // Use role data hook
// Removed unused BookingRequestFilters import
import type { FilterCriteria as ZonesFilterCriteria } from '@/lib/stores/zonesStore'; // Keep type import
// Removed unused BookingRequestFilters import on line below
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

    // Use useRoleData hook for consistency
    const { filterCriteria, uniqueFilterValues, isLoading, setFilterCriteria } = useRoleData('dmp');

    // Destructure using the correct keys from FilterCriteria interface
    const {
        searchTerm,
        city, // Correct key
        market, // Correct key
        macrozone, // Correct key
        equipment, // Correct key
        supplier, // Correct key
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
        { title: 'Город', options: cityOptions, selected: city, filterKey: 'city' as const }, // Use correct key
        {
            title: 'Маркет',
            options: marketOptions,
            selected: market, // Use correct key
            filterKey: 'market' as const,
        },
        {
            title: 'Макрозона',
            options: macrozoneOptions,
            selected: macrozone, // Use correct key
            filterKey: 'macrozone' as const,
        },
        {
            title: 'Оборудование',
            options: equipmentOptions,
            selected: equipment, // Use correct key
            filterKey: 'equipment' as const,
        },
        ...(role !== 'SUPPLIER'
            ? [
                  {
                      title: 'Поставщик',
                      options: supplierOptions,
                      selected: supplier, // Use correct key
                      filterKey: 'supplier' as const, // Use correct key
                  },
              ] // Map to supplierIds
            : []),
    ];

    // --- Internal Handler for Setting Filters ---
    // The DropdownFilterGroup likely calls this with an object like { [filterKey]: newValue }
    // Since we now use the correct keys directly from the store, no complex mapping is needed.
    const handleSetFilter = useCallback(
        (update: Partial<ZonesFilterCriteria>) => {
            // Directly pass the update to the store's setter
            setFilterCriteria(update);
        },
        [setFilterCriteria],
    );

    // --- Prepare filterCriteria for SelectedFiltersDisplay (Logic moved from ZonesFilters) ---
    // --- Prepare filterCriteria for SelectedFiltersDisplay ---
    // Use the correct keys from the store's filterCriteria
    const displayFilterCriteria: ZonesFilterCriteria = {
        // Ensure type compatibility
        city: city,
        market: market,
        macrozone: macrozone,
        equipment: equipment,
        supplier: supplier,
        searchTerm: searchTerm,
        activeTab: filterCriteria.activeTab, // Add missing activeTab
        // Add dummy/default values for other required fields if necessary
        category: filterCriteria.category, // Pass category if needed by display component
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
                // Pass the main store setter. Ensure SelectedFiltersDisplay uses correct keys for removal.
                setFilterCriteria={setFilterCriteria}
            />
        </div>
    );
}
