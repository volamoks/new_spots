"use client";

import { create } from 'zustand';
import { useZonesStore, createSuccessToast, createErrorToast, ZonesState } from './baseZonesStore';
import { ZoneStatus } from '@/types/zone';
import { useLoader } from '@/app/components/GlobalLoader';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';

interface CategoryManagerZonesState {
  // Дополнительные состояния для КМ
  selectedZones: string[];
  selectedSupplier: string | null;
  selectedCategory: string | null; // New state for selected category

  // Дополнительные методы для КМ
  selectZone: (zoneId: string) => void;
  deselectZone: (zoneId: string) => void;
  clearSelectedZones: () => void;
  selectSupplier: (supplierId: string) => void;
  selectCategory: (categoryId: string) => void; // New action
  createBooking: (supplierId: string | undefined, toast: any) => Promise<void>;
  refreshZones: (toast: any) => Promise<void>;
}

export const useCategoryManagerZonesStore = create<CategoryManagerZonesState>((set, get) => ({
  // Начальные значения
  selectedZones: [],
  selectedSupplier: null,
  selectedCategory: null, // Initial value

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

  selectCategory: (categoryId) => {  // New action implementation
    set({ selectedCategory: categoryId });
  },

  createBooking: async (supplierId, toast) => {
    const { selectedZones, selectedSupplier } = get();
    const showSuccessToast = createSuccessToast(toast);
    const showErrorToast = createErrorToast(toast);
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
      await get().refreshZones(toast);
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

  refreshZones: async (toast) => {
    const { fetchZones } = useZonesStore.getState();
    const showErrorToast = createErrorToast(toast);

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

  // Получаем toast
  const toast = useToast();

  // Объединяем их в один объект и создаем обертки для методов, требующих toast
  return {
    ...baseStore,
    ...cmStore,
    createBooking: (supplierId?: string) =>
      cmStore.createBooking(supplierId, toast),
    refreshZones: () => cmStore.refreshZones(toast),
    userCategory: session?.user?.category, // Keep this for potential future use (e.g., displaying the category)
  };
};
