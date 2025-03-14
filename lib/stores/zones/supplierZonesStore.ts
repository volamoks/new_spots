"use client";

import { create } from 'zustand';
import { useZonesStore, createSuccessToast, createErrorToast, ZonesState } from './baseZonesStore';
import { ZoneStatus } from '@/types/zone';
import { useLoaderStore, useLoader } from '@/app/components/GlobalLoader';
import { useToast } from '@/components/ui/use-toast';

interface SupplierZonesState {
  // Дополнительные методы для поставщика
  createBooking: (zoneIds: string[], toast: any, withLoading?: any) => Promise<void>;
  refreshZones: (toast: any) => Promise<void>;
}

export const useSupplierZonesStore = create<SupplierZonesState>((set, get) => ({
  // Методы для поставщика
  createBooking: async (zoneIds, toast, withLoading) => {
    const showSuccessToast = createSuccessToast(toast);
    const showErrorToast = createErrorToast(toast);
    
    try {
      // Если withLoading передан, используем его, иначе выполняем запрос напрямую
      const fetchPromise = fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ zoneIds }),
      }).then(async response => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Ошибка при создании бронирования");
        }
        return response.json();
      });
      
      let result;
      if (withLoading) {
        result = await withLoading(fetchPromise, "Создание бронирования...");
      } else {
        // Если withLoading не передан, просто используем глобальный лоадер напрямую
        const loaderStore = useLoaderStore.getState();
        try {
          loaderStore.setLoading(true, "Создание бронирования...");
          result = await fetchPromise;
        } finally {
          loaderStore.setLoading(false);
        }
      }

      showSuccessToast(
        'Бронирование создано',
        'Заявка на бронирование успешно создана'
      );

      // Обновляем список зон после создания бронирования
      await get().refreshZones(toast);
      
      return result;
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
      await fetchZones("SUPPLIER");
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
export const useSupplierZones = () => {
  // Получаем состояние и методы из базового стора
  const baseStore = useZonesStore();
  
  // Получаем методы из стора поставщика
  const supplierStore = useSupplierZonesStore();
  
  // Получаем toast и loader (теперь безопасно, так как мы в React компоненте)
  const toast = useToast();
  // Используем хук useLoader вместо прямого доступа к store
  const { withLoading } = useLoader();
  
  // Объединяем их в один объект и создаем обертки для методов, требующих toast и loader
  return {
    ...baseStore,
    ...supplierStore,
    createBooking: (zoneIds: string[]) => 
      supplierStore.createBooking(zoneIds, toast, withLoading),
    refreshZones: () => supplierStore.refreshZones(toast),
  };
};
