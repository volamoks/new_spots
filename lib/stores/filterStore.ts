import { create } from 'zustand';
import { Zone } from '@/types/zone';
import { debounce } from '@/lib/utils/debounce';

interface FilterState {
  activeTab: string;
  searchTerm: string;
  cityFilters: string[];
  marketFilters: string[];
  macrozoneFilters: string[];
  equipmentFilters: string[];
  supplierFilters: string[];
  categoryFilter: string | null;
  sortField: keyof Zone | null;
  sortDirection: 'asc' | 'desc' | null;
  currentPage: number;
  itemsPerPage: number;
  setActiveTab: (tab: string) => void;
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
    debouncedSetSearchTerm: (term: string) => void;
    toggleFilter: (
    type: 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier',
    value: string
  ) => void;
  removeFilter: (
    type: 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier',
    value: string
  ) => void;
  setCategoryFilter: (category: string | null) => void;
  setSorting: (field: keyof Zone, direction: 'asc' | 'desc' | null) => void;
  resetFilters: () => void;
  applyFilters: (zones: Zone[]) => Zone[];
}

export const useFilterStore = create<FilterState>((set, get) => ({
  activeTab: 'all',
  searchTerm: '',
  cityFilters: [],
  marketFilters: [],
  macrozoneFilters: [],
  equipmentFilters: [],
  supplierFilters: [],
  categoryFilter: null,
  sortField: null,
  sortDirection: null,
  currentPage: 1,
  itemsPerPage: 9,

  setActiveTab: (tab) => set({ activeTab: tab, searchTerm: '' }),
  // setSearchTerm: (term) => set({ searchTerm: term }),
    debouncedSetSearchTerm: debounce((term: string) => {
      set({ searchTerm: term })
    }, 300),
  setCurrentPage: (page) => set({ currentPage: page }),
  setItemsPerPage: (items) => set({ itemsPerPage: items }),
    setSearchTerm: (term) => set({searchTerm: term}),
  toggleFilter: (type, value) => {
    set((state) => {
      const currentFilters = state[`${type}Filters`];
      const updatedFilters = currentFilters.includes(value)
        ? currentFilters.filter((item) => item !== value)
        : [...currentFilters, value];
      return { [`${type}Filters`]: updatedFilters };
    });
  },
  removeFilter: (type, value) => {
    set((state) => ({
      [`${type}Filters`]: state[`${type}Filters`].filter((item) => item !== value),
    }));
  },
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setSorting: (field, direction) => set({ sortField: field, sortDirection: direction }),
  resetFilters: () =>
    set({
      activeTab: 'all',
      searchTerm: '',
      cityFilters: [],
      marketFilters: [],
      macrozoneFilters: [],
      equipmentFilters: [],
      supplierFilters: [],
      categoryFilter: null,
      sortField: null,
      sortDirection: null,
    }),

    applyFilters: (zones: Zone[]) => {
        const {
          searchTerm,
          cityFilters,
          marketFilters,
          macrozoneFilters,
          equipmentFilters,
          supplierFilters,
          categoryFilter,
          sortField,
          sortDirection
        } = get();

        let filtered = [...zones];

        if (categoryFilter) {
          filtered = filtered.filter((zone) => zone.category === categoryFilter);
        }

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

        if (sortField && sortDirection) {
          filtered.sort((a, b) => {
            const aValue = a[sortField] ?? '';
            const bValue = b[sortField] ?? '';

              if (typeof aValue === 'string' && typeof bValue === 'string') {
                  if (sortDirection === 'asc') {
                      return aValue.localeCompare(bValue);
                  } else {
                      return bValue.localeCompare(aValue);
                  }
              }
              return 0;
          });
        }
      return filtered;
    }
}));
