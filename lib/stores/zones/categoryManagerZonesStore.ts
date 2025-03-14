"use client";

import { create } from 'zustand';
import { useZonesStore, useZonesToasts, ZonesState } from './baseZonesStore';
import { ZoneStatus } from '@/types/zone';
import { useLoader } from '@/app/components/GlobalLoader';
import { useSession } from 'next-auth/react';

interface CategoryManagerZonesState {
  // Дополнительные состояния для КМ
  selectedZones: string[];
  selectedSupplier: string | null;
  
  // Дополнительные методы для КМ
  selectZone: (zoneId: string) => void;
  deselectZone: (zoneId: string) => void;
  clearSelectedZones: () => void;
  selectSupplier: (supplierId: string) => void;
  createBooking: (supplierId?: string) => Promise<void>;
  refreshZones: () => Promise<void>;
}

export const useCategoryManagerZonesStore = create<CategoryManagerZonesState>((set, get) => ({
  // Начальные значения
  selectedZones: [],
  selectedSupplier: null,
  
  // Методы для КМ
  selectZone: (zoneId) => {
    set(state => ({
      selectedZones: [...state.selectedZones, zoneId]
    }));
  },
  
  deselectZone: (zoneId) => {
    set(state => ({
      selectedZones: state.selectedZones.filter(id => id !== zoneId)
    }));
  },
  
  clearSelectedZones: () => {
    set({ selectedZones: [] });
  },
  
  selectSupplier: (supplierId) => {
    set({ selectedSupplier: supplierId });
  },
  
  createBooking: async (supplierId) => {
    const { selectedZones, selectedSupplier } = get();
    const { showSuccessToast, showErrorToast } = useZonesToasts();
    const { withLoading } = useLoader();
    
    // Проверяем, что выбраны зоны
    if (selectedZones.length === 0) {
      showErrorToast(
        'Ошибка',
        'Выберите хотя бы одну зону для бронирования'
      );
      return;
    }
    
    // Проверяем, что выбран поставщик
    const supplierToUse = supplierId || selectedSupplier;
    if (!supplierToUse) {
      showErrorToast(
        'Ошибка',
        'Выберите поставщика для бронирования'
      );
      return;
    }

    try {
      await withLoading(
        fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            zoneIds: selectedZones,
            supplierId: supplierToUse
          }),
        }).then(async response => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Ошибка при создании бронирования");
          }
          return response.json();
        }),
        "Создание бронирования..."
      );

      showSuccessToast(
        'Бронирование создано',
        'Заявка на бронирование успешно создана'
      );

      // Очищаем выбранные зоны
      get().clearSelectedZones();
      
      // Обновляем список зон после создания бронирования
      await get().refreshZones();
    } catch (error) {
      console.error('Ошибка при создании бронирования:', error);
      showErrorToast(
        'Ошибка',
        error instanceof Error
          ? error.message
          : 'Произошла ошибка при создании бронирования'
      );
      throw error;
    }
  },

  refreshZones: async () => {
    const { fetchZones } = useZonesStore.getState();
    const { showErrorToast } = useZonesToasts();

    try {
      await fetchZones("CATEGORY_MANAGER");
    } catch (error) {
      console.error('Ошибка при обновлении зон:', error);
      showErrorToast(
        'Ошибка',
        error instanceof Error
          ? error.message
          : 'Произошла ошибка при обновлении зон'
      );
    }
  },
}));

// Хук для удобного доступа ко всем методам и состояниям
export const useCategoryManagerZones = () => {
  // Получаем состояние и методы из базового стора
  const baseStore = useZonesStore();
  
  // Получаем методы из стора КМ
  const cmStore = useCategoryManagerZonesStore();
  
  // Получаем сессию пользователя
  const { data: session } = useSession();
  
  // Функция для загрузки зон с учетом категории КМ
  const fetchZonesWithCategory = async () => {
    if (session?.user?.category) {
      const { fetchZones } = baseStore;
      await fetchZones("CATEGORY_MANAGER");
    }
  };

  // Объединяем их в один объект
  return {
    ...baseStore,
    ...cmStore,
    fetchZonesWithCategory,
    userCategory: session?.user?.category,
  };
};
