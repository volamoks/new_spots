import { create } from 'zustand';
import { Zone, ZoneStatus } from '@prisma/client';

interface ZonesState {
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
    
    // Пагинация
    currentPage: number;
    itemsPerPage: number;
    
    // Состояние загрузки
    isLoading: boolean;
    
    // Уникальные значения для фильтров
    uniqueCities: string[];
    uniqueMarkets: string[];
    uniqueMacrozones: string[];
    uniqueEquipments: string[];
    
    // Действия
    setZones: (zones: Zone[]) => void;
    setActiveTab: (tab: string) => void;
    setSearchTerm: (term: string) => void;
    toggleFilter: (type: 'city' | 'market' | 'macrozone' | 'equipment', value: string) => void;
    setCurrentPage: (page: number) => void;
    setItemsPerPage: (count: number) => void;
    setIsLoading: (isLoading: boolean) => void;
    updateZoneStatus: (zoneId: string, newStatus: ZoneStatus) => void;
    resetFilters: () => void;
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
    currentPage: 1,
    itemsPerPage: 10,
    isLoading: false,
    uniqueCities: [],
    uniqueMarkets: [],
    uniqueMacrozones: [],
    uniqueEquipments: [],
    
    // Действия
    setZones: (zones) => {
        set({ zones });
        
        // Обновляем уникальные значения для фильтров
        const uniqueCities = Array.from(new Set(zones.map(zone => zone.city))).sort();
        const uniqueMarkets = Array.from(new Set(zones.map(zone => zone.market))).sort();
        const uniqueMacrozones = Array.from(new Set(zones.map(zone => zone.mainMacrozone))).sort();
        const uniqueEquipments = Array.from(new Set(zones.map(zone => zone.equipment))).filter(Boolean).sort();
        
        set({ uniqueCities, uniqueMarkets, uniqueMacrozones, uniqueEquipments });
        
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
        });
        set({ filteredZones });
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
    
    // Фильтрация по поисковому запросу
    if (state.searchTerm) {
        const term = state.searchTerm.toLowerCase();
        result = result.filter(
            zone =>
                zone.uniqueIdentifier.toLowerCase().includes(term) ||
                zone.city.toLowerCase().includes(term) ||
                zone.market.toLowerCase().includes(term) ||
                zone.mainMacrozone.toLowerCase().includes(term)
        );
    }
    
    return result;
}