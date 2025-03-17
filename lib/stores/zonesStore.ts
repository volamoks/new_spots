import { create } from 'zustand';
import { Zone } from '@/types/zone';
import { useFilterStore } from './filterStore';
import { useBookingStore } from './bookingStore';

interface ZonesState {
  zones: Zone[];
  isLoading: boolean;
  error: string | null;
  uniqueCities: string[];
  uniqueMarkets: string[];
  uniqueMacrozones: string[];
  uniqueEquipments: string[];
  uniqueSuppliers: string[];
  fetchZones: (role: string, category?: string) => Promise<void>;
  refreshZones: () => Promise<void>;
}

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

export const useZonesStore = create<ZonesState>((set, get) => ({
  zones: [],
  isLoading: false,
  error: null,
  uniqueCities: [],
  uniqueMarkets: [],
  uniqueMacrozones: [],
  uniqueEquipments: [],
  uniqueSuppliers: [],

  fetchZones: async (role: string, category?: string) => {
    set({ isLoading: true, error: null });
    try {
      const selectedSupplierInn = useBookingStore.getState().selectedSupplierInn;
      let url = '/api/zones';
      const queryParams = [];

      if (category) {
        queryParams.push(`category=${category}`);
      }
      if (role === 'CATEGORY_MANAGER' && selectedSupplierInn) {
        queryParams.push(`supplierInn=${selectedSupplierInn}`);
      }

      if (queryParams.length > 0) {
          url += `?${queryParams.join('&')}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch zones: ${response.status}`);
      }
      const data = await response.json();

      const { uniqueCities, uniqueMarkets, uniqueMacrozones, uniqueEquipments, uniqueSuppliers } =
        calculateUniqueValues(data);

      set({
        zones: data,
        isLoading: false,
        uniqueCities,
        uniqueMarkets,
        uniqueMacrozones,
        uniqueEquipments,
        uniqueSuppliers,
      });

    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

    refreshZones: async () => {
      const { fetchZones } = get();
      try {
        const currentCategory = useFilterStore.getState().categoryFilter;
        await fetchZones('', currentCategory || '');
      } catch (error) {
        console.error('Ошибка при обновлении зон:', error);
      }
    },
}));
