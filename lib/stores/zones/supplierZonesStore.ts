"use client";

import { create } from 'zustand';
import { useZonesStore, useZonesToasts, ZonesState } from './baseZonesStore';
import { ZoneStatus } from '@/types/zone';
import { useLoader } from '@/app/components/GlobalLoader';

interface SupplierZonesState {
  // Дополнительные методы для поставщика
  createBooking: (zoneIds: string[]) => Promise<void>;
  refreshZones: () => Promise<void>;
}

export const useSupplierZonesStore = create<SupplierZonesState>((set, get) => ({
  // Методы для поставщика
  createBooking: async (zoneIds) => {
    const { showSuccessToast, showErrorToast } = useZonesToasts();
    const { withLoading } = useLoader();

    try {
      await withLoading(
        fetch("/api/bookings", {
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
        }),
        "Создание бронирования..."
      );

      showSuccessToast(
        'Бронирование создано',
        'Заявка на бронирование успешно создана'
      );

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

  // Объединяем их в один объект
  return {
    ...baseStore,
    ...supplierStore,
  };
};
