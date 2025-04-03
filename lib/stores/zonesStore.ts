import { create } from 'zustand';
import { Zone, ZoneKeys } from "@/types/zone"; // Removed ZoneStatus as it's not used here directly
import { devtools } from 'zustand/middleware';
import { ZoneStatus as PrismaZoneStatus } from "@prisma/client"; // Import Prisma status for filter options type
// Remove useLoaderStore import
// import { useLoaderStore } from './loaderStore';
// Import the new utility and ApiError
import { fetchWithLoading, ApiError } from '@/lib/utils/api'; // Adjust path if necessary
// Import toast function
import { toast } from '@/components/ui/use-toast';

// --- Helper Functions ---

// REMOVED: calculateUniqueValues function (no longer needed here)

// --- Types ---

export interface FilterCriteria {
    searchTerm: string;
    activeTab: string; // Corresponds to ZoneStatus or 'all'
    city: string[]; // Renamed from cityFilters
    market: string[]; // Renamed from marketFilters
    macrozone: string[]; // Renamed from macrozoneFilters
    equipment: string[]; // Renamed from equipmentFilters
    supplier: string[]; // Renamed from supplierFilters
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

export interface ZonesState { // Export the interface
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
    removeZonesLocally: (zoneIds: string[]) => void; // Added
    clearSpecificFilters: (filterKeys: Array<keyof FilterCriteria>) => void; // Added
    resetFilters: () => void;
}

// --- Initial State ---

const initialFilterCriteria: FilterCriteria = {
    searchTerm: '',
    activeTab: 'all',
    city: [], // Renamed from cityFilters
    market: [], // Renamed from marketFilters
    macrozone: [], // Renamed from macrozoneFilters
    equipment: [], // Renamed from equipmentFilters
    supplier: [], // Renamed from supplierFilters
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
                // Remove direct loader import: const { withLoading } = useLoaderStore.getState();

                // Set local loading state (optional)
                set({ isLoading: true, error: null });

                try {
                    const params = new URLSearchParams();

                    // --- Append Filters ---
                    if (filterCriteria.activeTab && filterCriteria.activeTab !== 'all') {
                        params.append('status', filterCriteria.activeTab);
                    }
                    filterCriteria.macrozone.forEach(mz => params.append('macrozone', mz));
                    filterCriteria.city.forEach(city => params.append('city', city));
                    filterCriteria.market.forEach(market => params.append('market', market));
                    filterCriteria.equipment.forEach(eq => params.append('equipment', eq));
                    filterCriteria.supplier.forEach(sup => params.append('supplier', sup));
                    if (filterCriteria.category) {
                        params.append('category', filterCriteria.category);
                    }
                    if (filterCriteria.searchTerm) {
                        params.append('searchTerm', filterCriteria.searchTerm);
                    }

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

                    // Use fetchWithLoading
                    const { zones: fetchedZones, totalCount: fetchedTotalCount } = await fetchWithLoading<{ zones: Zone[], totalCount: number }>(
                        url,
                        'GET',
                        'Загрузка зон...'
                    );

                    if (!Array.isArray(fetchedZones) || typeof fetchedTotalCount !== 'number') {
                        console.error("Invalid API response structure:", { fetchedZones, fetchedTotalCount });
                        throw new Error("Invalid response structure from API");
                    }

                    set({
                        zones: fetchedZones,
                        totalCount: fetchedTotalCount,
                        isLoading: false, // Reset local loading
                        error: null,
                    });

                } catch (error) {
                    const errorMessage = error instanceof ApiError || error instanceof Error ? error.message : "Unknown error fetching zones";
                    console.error("Error fetching zones:", errorMessage);
                    set({ error: errorMessage, isLoading: false, zones: [], totalCount: 0 }); // Set error, clear data, reset loading
                    // Add error toast
                    toast({
                        title: 'Ошибка загрузки зон',
                        description: errorMessage,
                        variant: 'destructive',
                    });
                }
            },

            // New action to fetch filter options
            fetchFilterOptions: async () => {
                set({ isLoadingFilters: true, filtersError: null });
                try {
                    // Use fetchWithLoading - Note: This will trigger the *global* loader.
                    // If a separate indicator is truly needed, consider not using fetchWithLoading here
                    // or adding a key to withLoading if that feature exists.
                    // For now, we use fetchWithLoading for consistency.
                    const options = await fetchWithLoading<UniqueFilterValues>(
                        '/api/zones/filters',
                        'GET',
                        'Загрузка опций фильтров...'
                    );

                    // Validate fetched options structure if necessary
                    if (!options || typeof options !== 'object' || !Array.isArray(options.cities)) {
                        console.error("Invalid filter options structure:", options);
                        throw new Error("Invalid filter options structure from API");
                    }

                    set({
                        uniqueFilterValues: options,
                        isLoadingFilters: false, // Reset local loading
                        filtersError: null,
                    });
                } catch (error) {
                    const errorMessage = error instanceof ApiError || error instanceof Error ? error.message : "Unknown error fetching filter options";
                    console.error("Error fetching filter options:", errorMessage);
                    set({ filtersError: errorMessage, isLoadingFilters: false }); // Set error, reset loading
                    // Add error toast
                    toast({
                        title: 'Ошибка загрузки опций фильтров',
                        description: errorMessage,
                        variant: 'destructive',
                    });
                }
            },

            setFilterCriteria: (criteriaUpdate) => {
                const currentPage = 1;
                set((state) => ({
                    filterCriteria: { ...state.filterCriteria, ...criteriaUpdate },
                    paginationCriteria: { ...state.paginationCriteria, currentPage }
                }));
                get().fetchZones(); // This will now trigger the global loader via fetchWithLoading
            },

            setSortCriteria: (newSortCriteria) => {
                const currentPage = 1;
                set((state) => ({
                    sortCriteria: newSortCriteria,
                    paginationCriteria: { ...state.paginationCriteria, currentPage }
                }));
                get().fetchZones(); // This will now trigger the global loader via fetchWithLoading
            },

            setPaginationCriteria: (criteriaUpdate) => {
                set((state) => ({
                    paginationCriteria: { ...state.paginationCriteria, ...criteriaUpdate }
                }));
                get().fetchZones(); // This will now trigger the global loader via fetchWithLoading
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

            removeZonesLocally: (zoneIds) => {
                set((state) => {
                    const newZones = state.zones.filter(zone => !zoneIds.includes(zone.id));
                    const removedCount = state.zones.length - newZones.length;
                    return {
                        zones: newZones,
                        totalCount: Math.max(0, state.totalCount - removedCount), // Adjust total count
                        selectedZoneIds: new Set(Array.from(state.selectedZoneIds).filter(id => !zoneIds.includes(id))) // Remove from selection too
                    };
                });
                // Note: This is optimistic. If the API call in roleActionsStore fails,
                // zones might need to be restored or a full refresh triggered.
            },

            clearSpecificFilters: (filterKeys) => {
                set((state) => {
                    const newFilterCriteria = { ...state.filterCriteria };
                    filterKeys.forEach((key: keyof FilterCriteria) => { // Explicitly type key
                        if (key in initialFilterCriteria) {
                            // Reset the specific key to its initial value using indexed access
                            (newFilterCriteria as FilterCriteria)[key] = initialFilterCriteria[key]; // Use more specific type assertion
                        }
                    });
                    return {
                        filterCriteria: newFilterCriteria,
                        paginationCriteria: { ...state.paginationCriteria, currentPage: 1 } // Reset page
                    };
                });
                get().fetchZones(); // Refetch after clearing filters
            },

            resetFilters: () => {
                set({
                    filterCriteria: initialFilterCriteria,
                    sortCriteria: initialSortCriteria,
                    paginationCriteria: { ...get().paginationCriteria, currentPage: 1 },
                    selectedZoneIds: new Set(),
                });
                get().fetchZones(); // This will now trigger the global loader via fetchWithLoading
            },
        }),
        { name: 'zonesStore' }
    )
);
