"use client";

import { create } from 'zustand';
import { Zone, ZoneStatus } from "@/types/zone";
import { useToast as useToastHook } from '@/components/ui/use-toast';
import { useCallback } from 'react';

export interface ZonesState {
  // Данные
  zones: Zone[];
  filteredZones: Zone[];

  // Фильтры
  activeTab: string;
  searchTerm: string;
  cityFilters: string[];
  marketFilters: string[];
  macrozoneFilters: string[];
  equipmentFilters: string[];
  supplierFilters: string[];

  // Пагинация
  currentPage: number;
  itemsPerPage: number;

  // Состояние загрузки
  isLoading: boolean;
  error: string | null;

  // Уникальные значения для фильтров
  uniqueCities: string[];
  uniqueMarkets: string[];
  uniqueMacrozones: string[];
  uniqueEquipments: string[];
  uniqueSuppliers: string[];

  // Действия
  setZones: (zones: Zone[]) => void;
  setActiveTab: (tab: string) => void;
  setSearchTerm: (term: string) => void;
  toggleFilter: (type: 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier', value: string) => void;
  removeFilter: (type: 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier', value: string) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (count: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  updateZoneStatus: (zoneId: string, newStatus: ZoneStatus) => void;
  resetFilters: () => void;
  fetchZones: (role?: string) => Promise<void>;
}

export const useZonesStore = create<ZonesState>((set, get) => ({
  // Начальные значения
  zones: [],
  filteredZones: [],
  activeTab: 'all',
  searchTerm: '',
  cityFilters: [],
  marketFilters: [],
  macrozoneFilters: [],
  equipmentFilters: [],
  supplierFilters: [],
  currentPage: 1,
  itemsPerPage: 10,
  isLoading: false,
  error: null,
  uniqueCities: [],
  uniqueMarkets: [],
  uniqueMacrozones: [],
  uniqueEquipments: [],
  uniqueSuppliers: [],

  // Действия
  setZones: (zones) => {
    // Обновляем состояние zones в сторе
    set({ zones });
    
    // Обновляем уникальные значения для фильтров
    const uniqueCities = Array.from(new Set(zones.map(zone => zone.city || ''))).filter(Boolean).sort();
    const uniqueMarkets = Array.from(new Set(zones.map(zone => zone.market || ''))).filter(Boolean).sort();
    const uniqueMacrozones = Array.from(new Set(zones.map(zone => zone.mainMacrozone || ''))).filter(Boolean).sort();
    const uniqueEquipments = Array.from(new Set(zones.map(zone => zone.equipment || ''))).filter(Boolean).sort();
    const uniqueSuppliers = Array.from(new Set(zones.map(zone => zone.supplier || ''))).filter(Boolean).sort();
    
    set({ 
      uniqueCities, 
      uniqueMarkets, 
      uniqueMacrozones, 
      uniqueEquipments,
      uniqueSuppliers
    });
    
    // Применяем фильтры к новым данным
    const state = get();
    const filteredZones = applyFilters(zones, state);
    set({ filteredZones });
  },

  setActiveTab: (activeTab) => {
    set({ activeTab, currentPage: 1 });
    const state = get();
    const filteredZones = applyFilters(state.zones, { ...state, activeTab });
    set({ filteredZones });
  },

  setSearchTerm: (searchTerm) => {
    set({ searchTerm, currentPage: 1 });
    const state = get();
    const filteredZones = applyFilters(state.zones, { ...state, searchTerm });
    set({ filteredZones });
  },

  toggleFilter: (type, value) => {
    const state = get();
    let newFilters: string[] = [];

    switch (type) {
      case 'city':
        newFilters = state.cityFilters.includes(value)
          ? state.cityFilters.filter(item => item !== value)
          : [...state.cityFilters, value];
        set({ cityFilters: newFilters, currentPage: 1 });
        break;
      case 'market':
        newFilters = state.marketFilters.includes(value)
          ? state.marketFilters.filter(item => item !== value)
          : [...state.marketFilters, value];
        set({ marketFilters: newFilters, currentPage: 1 });
        break;
      case 'macrozone':
        newFilters = state.macrozoneFilters.includes(value)
          ? state.macrozoneFilters.filter(item => item !== value)
          : [...state.macrozoneFilters, value];
        set({ macrozoneFilters: newFilters, currentPage: 1 });
        break;
      case 'equipment':
        newFilters = state.equipmentFilters.includes(value)
          ? state.equipmentFilters.filter(item => item !== value)
          : [...state.equipmentFilters, value];
        set({ equipmentFilters: newFilters, currentPage: 1 });
        break;
      case 'supplier':
        newFilters = state.supplierFilters.includes(value)
          ? state.supplierFilters.filter(item => item !== value)
          : [...state.supplierFilters, value];
        set({ supplierFilters: newFilters, currentPage: 1 });
        break;
    }

    const updatedState = get();
    const filteredZones = applyFilters(updatedState.zones, updatedState);
    set({ filteredZones });
  },

  removeFilter: (type, value) => {
    const state = get();
    
    switch (type) {
      case 'city':
        set({ 
          cityFilters: state.cityFilters.filter(item => item !== value), 
          currentPage: 1 
        });
        break;
      case 'market':
        set({ 
          marketFilters: state.marketFilters.filter(item => item !== value), 
          currentPage: 1 
        });
        break;
      case 'macrozone':
        set({ 
          macrozoneFilters: state.macrozoneFilters.filter(item => item !== value), 
          currentPage: 1 
        });
        break;
      case 'equipment':
        set({ 
          equipmentFilters: state.equipmentFilters.filter(item => item !== value), 
          currentPage: 1 
        });
        break;
      case 'supplier':
        set({ 
          supplierFilters: state.supplierFilters.filter(item => item !== value), 
          currentPage: 1 
        });
        break;
    }

    const updatedState = get();
    const filteredZones = applyFilters(updatedState.zones, updatedState);
    set({ filteredZones });
  },

  setCurrentPage: (currentPage) => {
    set({ currentPage });
  },

  setItemsPerPage: (itemsPerPage) => {
    set({ itemsPerPage, currentPage: 1 });
  },

  setIsLoading: (isLoading) => {
    set({ isLoading });
  },

  updateZoneStatus: (zoneId, newStatus) => {
    const { zones } = get();
    const updatedZones = zones.map(zone =>
      zone.id === zoneId ? { ...zone, status: newStatus } : zone
    );
    set({ zones: updatedZones });

    // Применяем фильтры к обновленным данным
    const state = get();
    const filteredZones = applyFilters(updatedZones, state);
    set({ filteredZones });
  },

  resetFilters: () => {
    set({
      activeTab: 'all',
      searchTerm: '',
      cityFilters: [],
      marketFilters: [],
      macrozoneFilters: [],
      equipmentFilters: [],
      supplierFilters: [],
      currentPage: 1,
    });

    const state = get();
    const filteredZones = applyFilters(state.zones, {
      ...state,
      activeTab: 'all',
      searchTerm: '',
      cityFilters: [],
      marketFilters: [],
      macrozoneFilters: [],
      equipmentFilters: [],
      supplierFilters: [],
    });
    set({ filteredZones });
  },

  fetchZones: async (role = "DMP_MANAGER") => {
    set({ isLoading: true, error: null });
    try {
      // Используем API для получения данных
      // Для поставщика показываем только доступные зоны
      let url = '/api/zones';
      if (role === "SUPPLIER") {
        url += `?status=${ZoneStatus.AVAILABLE}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Ошибка при загрузке зон из API');
      }
      
      const fetchedZones = await response.json();
      console.log(`fetchZones: Получено ${fetchedZones.length} зон из API`);
      
      // Обновляем состояние в сторе
      get().setZones(fetchedZones);
      
      return fetchedZones;
    } catch (error) {
      console.error("Ошибка при загрузке зон из API:", error);
      set({
        error: error instanceof Error ? error.message : "Неизвестная ошибка при загрузке данных"
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Вспомогательная функция для применения фильтров
function applyFilters(zones: Zone[], state: Partial<ZonesState>): Zone[] {
  let result = [...zones];

  // Фильтрация по вкладкам (статус)
  if (state.activeTab !== 'all') {
    result = result.filter(zone => zone.status === state.activeTab);
  }

  // Фильтрация по городам
  if (state.cityFilters && state.cityFilters.length > 0) {
    result = result.filter(zone => state.cityFilters!.includes(zone.city));
  }

  // Фильтрация по магазинам
  if (state.marketFilters && state.marketFilters.length > 0) {
    result = result.filter(zone => state.marketFilters!.includes(zone.market));
  }

  // Фильтрация по макрозонам
  if (state.macrozoneFilters && state.macrozoneFilters.length > 0) {
    result = result.filter(zone => state.macrozoneFilters!.includes(zone.mainMacrozone));
  }

  // Фильтрация по оборудованию
  if (state.equipmentFilters && state.equipmentFilters.length > 0) {
    result = result.filter(zone => zone.equipment && state.equipmentFilters!.includes(zone.equipment));
  }

  // Фильтрация по поставщикам
  if (state.supplierFilters && state.supplierFilters.length > 0) {
    result = result.filter(zone => zone.supplier && state.supplierFilters!.includes(zone.supplier));
  }

  // Фильтрация по поисковому запросу
  if (state.searchTerm) {
    const term = state.searchTerm.toLowerCase();
    result = result.filter(
      zone =>
        zone.uniqueIdentifier?.toLowerCase().includes(term) ||
        zone.city?.toLowerCase().includes(term) ||
        zone.market?.toLowerCase().includes(term) ||
        zone.mainMacrozone?.toLowerCase().includes(term) ||
        zone.supplier?.toLowerCase().includes(term)
    );
  }

  return result;
}

/**
 * Хук для уведомлений о результатах действий с зонами
 */
export const useZonesToasts = () => {
  const { toast } = useToastHook();

  const showSuccessToast = useCallback((title: string, description: string) => {
    toast({
      title,
      description,
    });
  }, [toast]);

  const showErrorToast = useCallback((title: string, description: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  }, [toast]);

  return { showSuccessToast, showErrorToast };
};
