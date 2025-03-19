import { create } from 'zustand';
import { Zone } from '@/types/zone';
import { getCorrespondingMacrozones } from '@/lib/filterData';

interface BookingZonesState {
  // Data
  zones: Zone[];
  filteredZones: Zone[];
  paginatedZones: Zone[];
  isLoading: boolean;
  error: string | null;

  // Unique values for filters
  uniqueCities: string[];
  uniqueMarkets: string[];
  uniqueMacrozones: string[];
  uniqueEquipments: string[];
  uniqueSuppliers: string[];

  // Filter state
  searchTerm: string;
  cityFilters: string[];
  marketFilters: string[];
  macrozoneFilters: string[];
  equipmentFilters: string[];
  supplierFilters: string[];
  categoryFilter: string | null;

  // Pagination
  currentPage: number;
  itemsPerPage: number;

  // Actions
  fetchZones: (role: string, category?: string) => Promise<void>;
  refreshZones: () => Promise<void>;

  // Filter actions
  setSearchTerm: (term: string) => void;
  toggleFilter: (type: 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier', value: string) => void;
  removeFilter: (type: 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier', value: string) => void;
  setCategoryFilter: (category: string | null) => void;
  resetFilters: () => void;

  // Pagination actions
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
}

// Helper function to calculate unique values from zones
const calculateUniqueValues = (zones: Zone[]): {
  uniqueCities: string[];
  uniqueMarkets: string[];
  uniqueMacrozones: string[];
  uniqueEquipments: string[];
  uniqueSuppliers: string[];
} => {
  const uniqueCities = Array.from(new Set(zones.map((zone) => zone.city)));
  const uniqueMarkets = Array.from(new Set(zones.map((zone) => zone.market)));
  const uniqueMacrozones = Array.from(new Set(zones.map((zone) => zone.mainMacrozone)));
  const uniqueEquipments = Array.from(new Set(zones.map((zone) => zone.equipment)));
  const uniqueSuppliers = Array.from(new Set(zones.map((zone) => zone.supplier).filter(Boolean) as string[]));

  return { uniqueCities, uniqueMarkets, uniqueMacrozones, uniqueEquipments, uniqueSuppliers };
};

// Helper function to apply filters to zones
const applyFilters = (
  zones: Zone[],
  {
    searchTerm,
    cityFilters,
    marketFilters,
    macrozoneFilters,
    equipmentFilters,
    supplierFilters,
    categoryFilter,
  }: {
    searchTerm: string;
    cityFilters: string[];
    marketFilters: string[];
    macrozoneFilters: string[];
    equipmentFilters: string[];
    supplierFilters: string[];
    categoryFilter: string | null;
  }
): Zone[] => {
  let filtered = [...zones];

  // Apply category filter - only filter by macrozones
  // The backend already filters by category
  if (categoryFilter) {
    // Get corresponding macrozones for the category
    const macrozones = getCorrespondingMacrozones(categoryFilter);

    if (macrozones.length > 0) {
      filtered = filtered.filter((zone) => macrozones.includes(zone.mainMacrozone));
    }
  }

  // Apply search term filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (zone) =>
        zone.city.toLowerCase().includes(term) ||
        zone.market.toLowerCase().includes(term) ||
        zone.mainMacrozone.toLowerCase().includes(term) ||
        zone.uniqueIdentifier.toLowerCase().includes(term)
    );
  }

  // Apply other filters
  if (cityFilters.length > 0) {
    filtered = filtered.filter((zone) => cityFilters.includes(zone.city));
  }
  if (marketFilters.length > 0) {
    filtered = filtered.filter((zone) => marketFilters.includes(zone.market));
  }
  if (macrozoneFilters.length > 0) {
    filtered = filtered.filter((zone) => macrozoneFilters.includes(zone.mainMacrozone));
  }
  if (equipmentFilters.length > 0) {
    filtered = filtered.filter((zone) => equipmentFilters.includes(zone.equipment));
  }
  if (supplierFilters.length > 0) {
    filtered = filtered.filter((zone) => supplierFilters.includes(zone.supplier || ''));
  }

  return filtered;
};

// Helper function to paginate zones
const paginateZones = (
  zones: Zone[],
  currentPage: number,
  itemsPerPage: number
): Zone[] => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return zones.slice(startIndex, endIndex);
};

export const useBookingZonesStore = create<BookingZonesState>((set, get) => ({
  // Initial state
  zones: [],
  filteredZones: [],
  paginatedZones: [],
  isLoading: false,
  error: null,
  uniqueCities: [],
  uniqueMarkets: [],
  uniqueMacrozones: [],
  uniqueEquipments: [],
  uniqueSuppliers: [],
  searchTerm: '',
  cityFilters: [],
  marketFilters: [],
  macrozoneFilters: [],
  equipmentFilters: [],
  supplierFilters: [],
  categoryFilter: null,
  currentPage: 1,
  itemsPerPage: 10,

  // Fetch zones from API
  fetchZones: async (role: string, category?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = '/api/zones';

      // Store the category in state, but don't send it to the API
      // The API will handle category filtering through macrozones
      if (category) {
        set({ categoryFilter: category });
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch zones: ${response.status}`);
      }
      const data = await response.json();

      console.log(`Fetched ${data.length} zones from API`);

      const { uniqueCities, uniqueMarkets, uniqueMacrozones, uniqueEquipments, uniqueSuppliers } =
        calculateUniqueValues(data);

      // Apply filters to the fetched zones
      const filteredZones = applyFilters(data, {
        searchTerm: get().searchTerm,
        cityFilters: get().cityFilters,
        marketFilters: get().marketFilters,
        macrozoneFilters: get().macrozoneFilters,
        equipmentFilters: get().equipmentFilters,
        supplierFilters: get().supplierFilters,
        categoryFilter: category || get().categoryFilter,
      });

      console.log(`After filtering: ${filteredZones.length} zones remain`);

      // Paginate the filtered zones
      const paginatedZones = paginateZones(
        filteredZones,
        get().currentPage,
        get().itemsPerPage
      );

      console.log(`After pagination: ${paginatedZones.length} zones to display`);

      set({
        zones: data,
        filteredZones,
        paginatedZones,
        isLoading: false,
        uniqueCities,
        uniqueMarkets,
        uniqueMacrozones,
        uniqueEquipments,
        uniqueSuppliers,
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  // Refresh zones with current category
  refreshZones: async () => {
    const { fetchZones, categoryFilter } = get();
    try {
      await fetchZones('', categoryFilter || '');
    } catch (error: unknown) {
      console.error('Error refreshing zones:', error);
    }
  },

  // Filter actions
  setSearchTerm: (term: string) => {
    set((state) => {
      const filteredZones = applyFilters(state.zones, {
        ...state,
        searchTerm: term,
      });
      const paginatedZones = paginateZones(
        filteredZones,
        state.currentPage,
        state.itemsPerPage
      );
      return { searchTerm: term, filteredZones, paginatedZones };
    });
  },

  toggleFilter: (type, value) => {
    set((state) => {
      const currentFilters = state[`${type}Filters`];
      const updatedFilters = currentFilters.includes(value)
        ? currentFilters.filter((item) => item !== value)
        : [...currentFilters, value];

      const newState = { ...state, [`${type}Filters`]: updatedFilters };
      const filteredZones = applyFilters(state.zones, {
        ...newState,
      });
      const paginatedZones = paginateZones(
        filteredZones,
        state.currentPage,
        state.itemsPerPage
      );

      return { ...newState, filteredZones, paginatedZones };
    });
  },

  removeFilter: (type, value) => {
    set((state) => {
      const updatedFilters = state[`${type}Filters`].filter((item) => item !== value);
      const newState = { ...state, [`${type}Filters`]: updatedFilters };
      const filteredZones = applyFilters(state.zones, {
        ...newState,
      });
      const paginatedZones = paginateZones(
        filteredZones,
        state.currentPage,
        state.itemsPerPage
      );

      return { ...newState, filteredZones, paginatedZones };
    });
  },

  setCategoryFilter: (category) => {
    set((state) => {
      const newState = { ...state, categoryFilter: category };
      const filteredZones = applyFilters(state.zones, {
        ...newState,
      });
      const paginatedZones = paginateZones(
        filteredZones,
        state.currentPage,
        state.itemsPerPage
      );

      return { ...newState, filteredZones, paginatedZones };
    });
  },

  resetFilters: () => {
    set((state) => {
      const newState = {
        ...state,
        searchTerm: '',
        cityFilters: [],
        marketFilters: [],
        macrozoneFilters: [],
        equipmentFilters: [],
        supplierFilters: [],
      };
      const filteredZones = applyFilters(state.zones, {
        ...newState,
      });
      const paginatedZones = paginateZones(
        filteredZones,
        state.currentPage,
        state.itemsPerPage
      );

      return { ...newState, filteredZones, paginatedZones };
    });
  },

  // Pagination actions
  setCurrentPage: (page) => {
    set((state) => {
      const paginatedZones = paginateZones(
        state.filteredZones,
        page,
        state.itemsPerPage
      );
      return { currentPage: page, paginatedZones };
    });
  },

  setItemsPerPage: (items) => {
    set((state) => {
      const paginatedZones = paginateZones(
        state.filteredZones,
        state.currentPage,
        items
      );
      return { itemsPerPage: items, paginatedZones };
    });
  },
}));