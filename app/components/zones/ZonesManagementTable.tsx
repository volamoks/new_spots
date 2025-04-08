'use client';

import React, { useState, useMemo, useCallback } from 'react'; // Import hooks
import { Zone } from '@/types/zone';
// Remove Zustand store import
// import { useZonesManagementStore } from '@/lib/stores/zonesManagementStore';
import { ZoneFilters, ZoneFilterValues } from './zones/ZoneFilters'; // Import type
import { ZoneTableDisplay } from './zones/ZoneTableDisplay';

interface ZonesManagementTableProps {
    zones: Zone[]; // This is the original, unfiltered list for the current page/view
    onRefresh: () => void;
}

// Helper function for filtering (moved here or could be imported from utils)
const filterZones = (zones: Zone[], filters: ZoneFilterValues): Zone[] => {
    if (!zones || zones.length === 0) {
        return [];
    }
    return zones.filter(zone => {
        const lowerSearchTerm = filters.searchTerm.toLowerCase();
        const matchesSearch = !filters.searchTerm || // Match if search term is empty
            zone.uniqueIdentifier.toLowerCase().includes(lowerSearchTerm) ||
            zone.city.toLowerCase().includes(lowerSearchTerm) ||
            zone.market.toLowerCase().includes(lowerSearchTerm) ||
            zone.mainMacrozone.toLowerCase().includes(lowerSearchTerm);

        const matchesStatus =
            filters.statusFilter === 'all' || zone.status === filters.statusFilter;

        return matchesSearch && matchesStatus;
    });
};


export function ZonesManagementTable({ zones, onRefresh }: ZonesManagementTableProps) {
    // Remove Zustand usage
    // const setZonesAndRefresh = useZonesManagementStore(state => state.setZonesAndRefresh);

    // Local state for filters
    const [currentFilters, setCurrentFilters] = useState<ZoneFilterValues>({ searchTerm: '', statusFilter: 'all' });

    // Calculate filtered zones based on props and local filter state
    const filteredZones = useMemo(() => {
        console.log("Recalculating filtered zones with filters:", currentFilters); // Debug log
        return filterZones(zones, currentFilters);
    }, [zones, currentFilters]);

    // Callback to update filters
    const handleFilterChange = useCallback((newFilters: ZoneFilterValues) => {
        console.log("Handling filter change:", newFilters); // Debug log
        setCurrentFilters(newFilters);
    }, []);

    // Remove useEffect related to Zustand store initialization
    // useEffect(() => {
    //     setZonesAndRefresh(zones, onRefresh);
    // }, [zones, onRefresh, setZonesAndRefresh]);

    console.log("Rendering ZonesManagementTable. Original zones:", zones.length, "Filtered zones:", filteredZones.length); // Debug log

    return (
        <div className="space-y-4">
            {/* Pass local state handler and refresh function */}
            <ZoneFilters onFilterChange={handleFilterChange} onRefresh={onRefresh} />
            {/* Pass original and filtered zones */}
            <ZoneTableDisplay originalZones={zones} filteredZones={filteredZones} />
        </div>
    );
}
