import { create } from 'zustand';
import { Zone } from '@/types/zone';
import { ZoneFilterValues } from '@/app/components/zones/ZoneFilters';

interface ZonesManagementState {
    originalZones: Zone[];
    currentFilters: ZoneFilterValues;
    filteredZones: Zone[];
    onRefresh: () => void; // Store the refresh function
    setZonesAndRefresh: (zones: Zone[], onRefresh: () => void) => void; // Action to initialize
    handleFilterChange: (newFilters: ZoneFilterValues) => void;
}

// Helper function for filtering (can be kept here or moved to utils)
const filterZones = (zones: Zone[], filters: ZoneFilterValues): Zone[] => {
    if (!zones || zones.length === 0) {
        return [];
    }
    return zones.filter(zone => {
        const lowerSearchTerm = filters.searchTerm.toLowerCase();
        const matchesSearch =
            zone.uniqueIdentifier.toLowerCase().includes(lowerSearchTerm) ||
            zone.city.toLowerCase().includes(lowerSearchTerm) ||
            zone.market.toLowerCase().includes(lowerSearchTerm) ||
            zone.mainMacrozone.toLowerCase().includes(lowerSearchTerm);

        const matchesStatus =
            filters.statusFilter === 'all' || zone.status === filters.statusFilter;

        return matchesSearch && matchesStatus;
    });
};


export const useZonesManagementStore = create<ZonesManagementState>((set, get) => ({
    originalZones: [],
    currentFilters: { searchTerm: '', statusFilter: 'all' },
    filteredZones: [],
    onRefresh: () => { console.warn('onRefresh not initialized in zonesManagementStore'); }, // Default no-op

    // Action to initialize or update the zones and the refresh callback
    setZonesAndRefresh: (zones, onRefresh) => {
        set({
            originalZones: zones,
            onRefresh: onRefresh,
            // Recalculate filtered zones based on new original zones and existing filters
            filteredZones: filterZones(zones, get().currentFilters),
        });
    },

    // Action to update filters and recalculate filtered zones
    handleFilterChange: (newFilters) => {
        set(state => ({
            currentFilters: newFilters,
            filteredZones: filterZones(state.originalZones, newFilters),
        }));
    },
}));