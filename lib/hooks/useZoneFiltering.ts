import { useState, useMemo, useCallback } from 'react';
import { Zone } from '@/types/zone';
import { ZoneFilterValues } from '@/app/components/zones/ZoneFilters';


export const useZoneFiltering = (initialZones: Zone[]) => {
    // State to hold the current filter values
    const [currentFilters, setCurrentFilters] = useState<ZoneFilterValues>({
        searchTerm: '',
        statusFilter: 'all',
        categoryFilter: '', // Initialize categoryFilter
    });

    // Callback to update the filter state, designed to be passed to ZoneFilters
    const handleFilterChange = useCallback((newFilters: ZoneFilterValues) => {
        setCurrentFilters(newFilters);
    }, []);

    // Memoize the filtered zones calculation
    const filteredZones = useMemo(() => {
        // Return all zones if the initial list is empty or null
        if (!initialZones || initialZones.length === 0) {
            return [];
        }

        return initialZones.filter(zone => {
            const lowerSearchTerm = currentFilters.searchTerm.toLowerCase();
            const matchesSearch =
                zone.uniqueIdentifier.toLowerCase().includes(lowerSearchTerm) ||
                zone.city.toLowerCase().includes(lowerSearchTerm) ||
                zone.market.toLowerCase().includes(lowerSearchTerm) ||
                zone.mainMacrozone.toLowerCase().includes(lowerSearchTerm);

            const matchesStatus = currentFilters.statusFilter === 'all' || zone.status === currentFilters.statusFilter;

            // Add category filter logic
            const lowerCategoryFilter = currentFilters.categoryFilter.toLowerCase();
            const matchesCategory = !lowerCategoryFilter || zone.mainMacrozone.toLowerCase().includes(lowerCategoryFilter);

            return matchesSearch && matchesStatus && matchesCategory; // Include category match
        });
    }, [initialZones, currentFilters]); // Recalculate only when zones or filters change

    return {
        filteredZones,
        handleFilterChange,
        currentFilters, // Expose current filters if needed elsewhere, e.g., for display
    };
};