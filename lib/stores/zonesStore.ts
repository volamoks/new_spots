import { create } from 'zustand';
import { Zone, ZoneKeys } from "@/types/zone"; // Removed ZoneStatus as it's not used here directly
import { devtools } from 'zustand/middleware';
import { ZoneStatus as PrismaZoneStatus } from "@prisma/client"; // Import Prisma status for filter options type
import { useLoaderStore } from './loaderStore'; // Import the loader store

// --- Helper Functions ---

// REMOVED: calculateUniqueValues function (no longer needed here)

// --- Types ---

export interface FilterCriteria {
    searchTerm: string;
    activeTab: string; // Corresponds to ZoneStatus or 'all'
    cityFilters: string[];
    marketFilters: string[];
    macrozoneFilters: string[];
    equipmentFilters: string[];
    supplierFilters: string[];
    // Add category filter if needed
    category?: string;
}

interface SortCriteria {
    field: ZoneKeys | null;
    direction: 'asc' | 'desc' | null;
}

interface PaginationCriteria {
    currentPage: number;
    itemsPerPage: number;
}

// Updated to match the new API endpoint response
interface UniqueFilterValues {
    cities: string[];
    markets: string[];
    macrozones: string[];
    equipments: string[];
    suppliers: string[];
    statuses: PrismaZoneStatus[]; // Use Prisma enum type
}

interface ZonesState {
    // Core State
    zones: Zone[];
    totalCount: number;
    selectedZoneIds: Set<string>;
    isLoading: boolean; // Keep state for potential direct use, but fetch won't set it
    isLoadingFilters: boolean; // Separate loading state for filter options
    error: string | null;
    filtersError: string | null; // Separate error state for filter options

    // Criteria State
    filterCriteria: FilterCriteria;
    sortCriteria: SortCriteria;
    paginationCriteria: PaginationCriteria;

    // Filter Options State
    uniqueFilterValues: UniqueFilterValues;

    // Actions
    fetchZones: () => Promise<void>;
    fetchFilterOptions: () => Promise<void>; // New action
    setFilterCriteria: (criteria: Partial<FilterCriteria>) => void;
    setSortCriteria: (criteria: SortCriteria) => void;
    setPaginationCriteria: (criteria: Partial<PaginationCriteria>) => void;
    toggleZoneSelection: (zoneId: string) => void;
    toggleSelectAll: (select: boolean) => void;
    clearSelection: () => void;
    updateZoneLocally: (zoneId: string, updates: Partial<Zone>) => void;
    resetFilters: () => void;
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
    category: undefined,
};

const initialSortCriteria: SortCriteria = {
    field: 'city',
    direction: 'asc',
};

const initialPaginationCriteria: PaginationCriteria = {
    currentPage: 1,
    itemsPerPage: 20,
};

const initialUniqueFilterValues: UniqueFilterValues = {
    cities: [], markets: [], macrozones: [], equipments: [], suppliers: [], statuses: []
};

// --- Store Definition ---

export const useZonesStore = create<ZonesState>()(
    devtools(
        (set, get) => ({
            // Core State
            zones: [],
            totalCount: 0,
            selectedZoneIds: new Set(),
            isLoading: false, // Initialize internal state
            isLoadingFilters: false,
            error: null,
            filtersError: null,

            // Criteria State
            filterCriteria: initialFilterCriteria,
            sortCriteria: initialSortCriteria,
            paginationCriteria: initialPaginationCriteria,

            // Filter Options State
            uniqueFilterValues: initialUniqueFilterValues,

            // --- Actions ---
            fetchZones: async () => {
                const { filterCriteria, sortCriteria, paginationCriteria } = get();
                const { withLoading } = useLoaderStore.getState(); // Get loader helper

                // Define the actual fetch logic
                const fetchLogic = async () => {
                    // Don't reset filtersError here, only zone fetch error
                    // Remove internal isLoading set: set({ isLoading: true, error: null });
                    set({ error: null }); // Reset only error

                    try {
                        const params = new URLSearchParams();

                        // --- Append Filters ---
                        if (filterCriteria.activeTab && filterCriteria.activeTab !== 'all') {
                            params.append('status', filterCriteria.activeTab);
                        }
                        filterCriteria.macrozoneFilters.forEach(mz => params.append('macrozone', mz));
                        filterCriteria.cityFilters.forEach(city => params.append('city', city));
                        filterCriteria.marketFilters.forEach(market => params.append('market', market));
                        filterCriteria.equipmentFilters.forEach(eq => params.append('equipment', eq));
                        filterCriteria.supplierFilters.forEach(sup => params.append('supplier', sup));
                        if (filterCriteria.category) {
                            params.append('category', filterCriteria.category);
                        }
                        // Add searchTerm if API supports it

                        // --- Append Sorting ---
                        if (sortCriteria.field && sortCriteria.direction) {
                            params.append('sortField', sortCriteria.field);
                            params.append('sortDirection', sortCriteria.direction);
                        }

                        // --- Append Pagination ---
                        params.append('page', paginationCriteria.currentPage.toString());
                        params.append('pageSize', paginationCriteria.itemsPerPage.toString());

                        const url = `/api/zones?${params.toString()}`;
                        console.log("--- DEBUG: Fetching zones URL ---");
                        console.log("URL:", url);
                        console.log("Current Filter Criteria:", filterCriteria);
                        console.log("--- END DEBUG ---");


                        const response = await fetch(url);
                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({ error: `Failed to fetch zones (status: ${response.status})` }));
                            throw new Error(errorData.error || `Failed to fetch zones (status: ${response.status})`);
                        }

                        const { zones: fetchedZones, totalCount: fetchedTotalCount } = await response.json();

                        if (!Array.isArray(fetchedZones) || typeof fetchedTotalCount !== 'number') {
                            console.error("Invalid API response structure:", { fetchedZones, fetchedTotalCount });
                            throw new Error("Invalid response structure from API");
                        }

                        set({
                            zones: fetchedZones,
                            totalCount: fetchedTotalCount,
                            // Remove internal isLoading set: isLoading: false,
                            // REMOVED calculation of unique values here
                        });

                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : "Unknown error fetching zones";
                        console.error("Error fetching zones:", errorMessage);
                        // Remove internal isLoading set: set({ error: errorMessage, isLoading: false, zones: [], totalCount: 0 });
                        set({ error: errorMessage, zones: [], totalCount: 0 }); // Set error, clear data
                    }
                };

                // Wrap the fetch logic with the global loader
                await withLoading(fetchLogic(), 'Загрузка зон...'); // Pass loading message
            },

            // New action to fetch filter options
            fetchFilterOptions: async () => {
                // Don't reset main error state here
                set({ isLoadingFilters: true, filtersError: null });
                try {
                    const response = await fetch('/api/zones/filters');
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch filter options' }));
                        throw new Error(errorData.error || 'Failed to fetch filter options');
                    }
                    const options: UniqueFilterValues = await response.json();

                    // Validate fetched options structure if necessary
                    if (!options || typeof options !== 'object' || !Array.isArray(options.cities)) {
                        console.error("Invalid filter options structure:", options);
                        throw new Error("Invalid filter options structure from API");
                    }

                    set({
                        uniqueFilterValues: options,
                        isLoadingFilters: false,
                    });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error fetching filter options";
                    console.error("Error fetching filter options:", errorMessage);
                    set({ filtersError: errorMessage, isLoadingFilters: false });
                }
            },

            setFilterCriteria: (criteriaUpdate) => {
                const currentPage = 1;
                set((state) => ({
                    filterCriteria: { ...state.filterCriteria, ...criteriaUpdate },
                    paginationCriteria: { ...state.paginationCriteria, currentPage }
                }));
                get().fetchZones(); // This will now trigger the global loader
            },

            setSortCriteria: (newSortCriteria) => {
                const currentPage = 1;
                set((state) => ({
                    sortCriteria: newSortCriteria,
                    paginationCriteria: { ...state.paginationCriteria, currentPage }
                }));
                get().fetchZones(); // This will now trigger the global loader
            },

            setPaginationCriteria: (criteriaUpdate) => {
                set((state) => ({
                    paginationCriteria: { ...state.paginationCriteria, ...criteriaUpdate }
                }));
                get().fetchZones(); // This will now trigger the global loader
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

            toggleSelectAll: (select) => {
                set((state) => {
                    const newSelection = new Set(state.selectedZoneIds);
                    const zoneIdsOnPage = state.zones.map(z => z.id);
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
                // Optionally refetch if update affects filtering/sorting
                // get().fetchZones();
            },

            resetFilters: () => {
                set({
                    filterCriteria: initialFilterCriteria,
                    sortCriteria: initialSortCriteria,
                    paginationCriteria: { ...get().paginationCriteria, currentPage: 1 },
                    selectedZoneIds: new Set(),
                });
                get().fetchZones(); // This will now trigger the global loader
            },
        }),
        { name: 'zonesStore' }
    )
);
