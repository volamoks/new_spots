import { create } from 'zustand';
import { Zone, ZoneKeys } from "@/types/zone";
import { devtools } from 'zustand/middleware'; // Optional: for debugging

// --- Helper Functions ---

// Function to calculate unique values for filters
const calculateUniqueValues = (zones: Zone[]): UniqueFilterValues => {
    const uniqueCities = Array.from(new Set(zones.map(zone => zone.city || ''))).filter(Boolean).sort();
    const uniqueMarkets = Array.from(new Set(zones.map(zone => zone.market || ''))).filter(Boolean).sort();
    const uniqueMacrozones = Array.from(new Set(zones.map(zone => zone.mainMacrozone || ''))).filter(Boolean).sort();
    const uniqueEquipments = Array.from(new Set(zones.map(zone => zone.equipment || ''))).filter(Boolean).sort();
    const uniqueSuppliers = Array.from(new Set(zones.map(zone => zone.supplier || ''))).filter(Boolean).sort();
    const uniqueStatuses = Array.from(new Set(zones.map(zone => zone.status || ''))).filter(Boolean).sort();

    return {
        cities: uniqueCities,
        markets: uniqueMarkets,
        macrozones: uniqueMacrozones,
        equipments: uniqueEquipments,
        suppliers: uniqueSuppliers,
        statuses: uniqueStatuses,
    };
};

// Function to apply filters and sorting
const applyFiltersAndSort = (zones: Zone[], criteria: FilterCriteria, sort: SortCriteria): Zone[] => {
    let result = [...zones];

    // Filter by status (activeTab)
    if (criteria.activeTab && criteria.activeTab !== 'all') {
        result = result.filter(zone => zone.status === criteria.activeTab);
    }
    // Filter by search term
    if (criteria.searchTerm) {
        const term = criteria.searchTerm.toLowerCase();
        result = result.filter(zone =>
            Object.values(zone).some(value =>
                String(value).toLowerCase().includes(term)
            )
        );
    }
    // Filter by specific fields
    if (criteria.cityFilters.length > 0) {
        result = result.filter(zone => criteria.cityFilters.includes(zone.city));
    }
    if (criteria.marketFilters.length > 0) {
        result = result.filter(zone => criteria.marketFilters.includes(zone.market));
    }
    if (criteria.macrozoneFilters.length > 0) {
        result = result.filter(zone => criteria.macrozoneFilters.includes(zone.mainMacrozone));
    }
    if (criteria.equipmentFilters.length > 0) {
        result = result.filter(zone => zone.equipment && criteria.equipmentFilters.includes(zone.equipment));
    }
    if (criteria.supplierFilters.length > 0) {
        result = result.filter(zone => zone.supplier && criteria.supplierFilters.includes(zone.supplier));
    }

    // Sorting
    if (sort.field && sort.direction) {
        const { field, direction } = sort;
        result.sort((a, b) => {
            const valueA = a[field] ?? '';
            const valueB = b[field] ?? '';

            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
            } else if (typeof valueA === 'number' && typeof valueB === 'number') {
                return direction === 'asc' ? valueA - valueB : valueB - valueA;
            } else if (valueA instanceof Date && valueB instanceof Date) {
                return direction === 'asc' ? valueA.getTime() - valueB.getTime() : valueB.getTime() - valueA.getTime();
            }
            return 0; // Default: no sort for incompatible types
        });
    }

    return result;
};

// Function to paginate results
const paginate = (zones: Zone[], criteria: PaginationCriteria): Zone[] => {
    const startIndex = (criteria.currentPage - 1) * criteria.itemsPerPage;
    const endIndex = startIndex + criteria.itemsPerPage;
    return zones.slice(startIndex, endIndex);
};


// --- Types ---

interface FilterCriteria {
    searchTerm: string;
    activeTab: string; // Corresponds to ZoneStatus or 'all'
    cityFilters: string[];
    marketFilters: string[];
    macrozoneFilters: string[];
    equipmentFilters: string[];
    supplierFilters: string[];
}

interface SortCriteria {
    field: ZoneKeys | null;
    direction: 'asc' | 'desc' | null;
}

interface PaginationCriteria {
    currentPage: number;
    itemsPerPage: number;
}

interface UniqueFilterValues {
    cities: string[];
    markets: string[];
    macrozones: string[];
    equipments: string[];
    suppliers: string[];
    statuses: string[];
}

interface ZonesState {
    // Core State
    zones: Zone[];
    selectedZoneIds: Set<string>; // Use Set for efficient add/delete/check
    isLoading: boolean;
    error: string | null;

    // Criteria State
    filterCriteria: FilterCriteria;
    sortCriteria: SortCriteria;
    paginationCriteria: PaginationCriteria;

    // Derived State (managed internally by actions)
    _filteredSortedZones: Zone[]; // Internal state for filtered/sorted data before pagination
    paginatedZones: Zone[]; // Final data for UI display
    uniqueFilterValues: UniqueFilterValues;
    totalFilteredCount: number; // Total count after filtering, before pagination

    // Actions
    fetchZones: (role?: string) => Promise<void>;
    setFilterCriteria: (criteria: Partial<FilterCriteria>) => void;
    setSortCriteria: (criteria: SortCriteria) => void;
    setPaginationCriteria: (criteria: Partial<PaginationCriteria>) => void;
    toggleZoneSelection: (zoneId: string) => void;
    toggleSelectAll: (select: boolean, zoneIdsOnPage: string[]) => void;
    clearSelection: () => void;
    updateZoneLocally: (zoneId: string, updates: Partial<Zone>) => void; // For optimistic UI
    resetFilters: () => void;
    _recalculateDerivedState: () => void; // Internal action
}

// --- Initial State ---

const initialFilterCriteria: FilterCriteria = {
    searchTerm: '',
    activeTab: 'all',
    cityFilters: [],
    marketFilters: [],
    macrozoneFilters: [],
    equipmentFilters: [],
    supplierFilters: [],
};

const initialSortCriteria: SortCriteria = {
    field: null,
    direction: null,
};

const initialPaginationCriteria: PaginationCriteria = {
    currentPage: 1,
    itemsPerPage: 10, // Default items per page
};

// --- Store Definition ---

export const useZonesStore = create<ZonesState>()(
    devtools( // Optional: Wrap with devtools for Redux DevTools extension
        (set, get) => ({
            // Core State
            zones: [],
            selectedZoneIds: new Set(),
            isLoading: false,
            error: null,

            // Criteria State
            filterCriteria: initialFilterCriteria,
            sortCriteria: initialSortCriteria,
            paginationCriteria: initialPaginationCriteria,

            // Derived State
            _filteredSortedZones: [],
            paginatedZones: [],
            uniqueFilterValues: { cities: [], markets: [], macrozones: [], equipments: [], suppliers: [], statuses: [] },
            totalFilteredCount: 0,

            // --- Internal Action ---
            _recalculateDerivedState: () => {
                const { zones, filterCriteria, sortCriteria, paginationCriteria } = get();
                const filteredSorted = applyFiltersAndSort(zones, filterCriteria, sortCriteria);
                const paginated = paginate(filteredSorted, paginationCriteria);
                set({
                    _filteredSortedZones: filteredSorted,
                    paginatedZones: paginated,
                    totalFilteredCount: filteredSorted.length,
                    // Reset page to 1 if current page becomes invalid after filtering
                    paginationCriteria: {
                        ...paginationCriteria,
                        currentPage: Math.min(paginationCriteria.currentPage, Math.ceil(filteredSorted.length / paginationCriteria.itemsPerPage) || 1)
                    }
                });
                // Re-paginate with potentially updated currentPage
                const finalPaginated = paginate(filteredSorted, get().paginationCriteria);
                set({ paginatedZones: finalPaginated });
            },

            // --- Public Actions ---
            fetchZones: async () => { // Removed unused 'role' parameter
                set({ isLoading: true, error: null });
                try {
                    let url = '/api/zones';
                    const params = new URLSearchParams(); // Changed 'let' to 'const'
                    // Example: Filter by status on backend if needed for specific roles
                    // if (role === "SUPPLIER" || role === "CATEGORY_MANAGER") {
                    //     params.append("status", ZoneStatus.AVAILABLE);
                    // }
                    const paramsString = params.toString();
                    if (paramsString) url += `?${paramsString}`;

                    const response = await fetch(url);
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch zones' }));
                        throw new Error(errorData.error || 'Failed to fetch zones');
                    }
                    const fetchedZones: Zone[] = await response.json();

                    set({
                        zones: fetchedZones,
                        isLoading: false,
                        uniqueFilterValues: calculateUniqueValues(fetchedZones),
                        selectedZoneIds: new Set(), // Clear selection on new data fetch
                    });
                    get()._recalculateDerivedState(); // Apply initial filters/pagination
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error fetching zones";
                    console.error("Error fetching zones:", errorMessage);
                    set({ error: errorMessage, isLoading: false, zones: [], _filteredSortedZones: [], paginatedZones: [] });
                }
            },

            setFilterCriteria: (criteriaUpdate) => {
                set((state) => ({
                    filterCriteria: { ...state.filterCriteria, ...criteriaUpdate },
                    // Reset to page 1 when filters change
                    paginationCriteria: { ...state.paginationCriteria, currentPage: 1 }
                }));
                get()._recalculateDerivedState();
            },

            setSortCriteria: (newSortCriteria) => {
                set({ sortCriteria: newSortCriteria });
                get()._recalculateDerivedState();
            },

            setPaginationCriteria: (criteriaUpdate) => {
                set((state) => ({
                    paginationCriteria: { ...state.paginationCriteria, ...criteriaUpdate }
                }));
                // Only need to re-paginate, not re-filter/sort
                const { _filteredSortedZones, paginationCriteria } = get();
                const paginated = paginate(_filteredSortedZones, paginationCriteria);
                set({ paginatedZones: paginated });
            },

            toggleZoneSelection: (zoneId) => {
                set((state) => {
                    const newSelection = new Set(state.selectedZoneIds);
                    if (newSelection.has(zoneId)) {
                        newSelection.delete(zoneId);
                    } else {
                        newSelection.add(zoneId);
                    }
                    return { selectedZoneIds: newSelection };
                });
            },

            toggleSelectAll: (select, zoneIdsOnPage) => {
                set((state) => {
                    const newSelection = new Set(state.selectedZoneIds);
                    if (select) {
                        zoneIdsOnPage.forEach(id => newSelection.add(id));
                    } else {
                        zoneIdsOnPage.forEach(id => newSelection.delete(id));
                    }
                    return { selectedZoneIds: newSelection };
                });
            },

            clearSelection: () => {
                set({ selectedZoneIds: new Set() });
            },

            updateZoneLocally: (zoneId, updates) => {
                set((state) => ({
                    zones: state.zones.map(zone =>
                        zone.id === zoneId ? { ...zone, ...updates } : zone
                    )
                }));
                // Recalculate derived state as filters/sorting might be affected
                get()._recalculateDerivedState();
                // Optionally recalculate unique values if relevant fields changed
                // set({ uniqueFilterValues: calculateUniqueValues(get().zones) });
            },

            resetFilters: () => {
                set({
                    filterCriteria: initialFilterCriteria,
                    sortCriteria: initialSortCriteria,
                    // Optionally reset pagination, or keep itemsPerPage
                    paginationCriteria: { ...get().paginationCriteria, currentPage: 1 },
                    selectedZoneIds: new Set(), // Also clear selection
                });
                get()._recalculateDerivedState();
            },
        }),
        { name: 'zonesStore' } // Name for Redux DevTools
    )
);
