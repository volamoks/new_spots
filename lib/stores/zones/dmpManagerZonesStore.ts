"use client";

import { create } from 'zustand';
import { useZonesStore, createSuccessToast, createErrorToast, ZonesState } from './baseZonesStore';
import { ZoneStatus } from '@/types/zone';
import { useLoader } from '@/app/components/GlobalLoader';
import { useToast } from '@/components/ui/use-toast';

interface DmpManagerZonesState {
  // Дополнительные методы для DMP-менеджера
  changeZoneStatus: (zoneId: string, newStatus: ZoneStatus, toast: any) => Promise<void>;
  refreshZones: (toast: any) => Promise<void>;
}

export const useDmpManagerZonesStore = create<DmpManagerZonesState>((set, get) => ({
  // Методы для DMP-менеджера
  changeZoneStatus: async (zoneId, newStatus, toast) => {
    const showSuccessToast = createSuccessToast(toast);
    const showErrorToast = createErrorToast(toast);
    const { withLoading } = useLoader();
    const { updateZoneStatus } = useZonesStore.getState();

    try {
      await withLoading(
        fetch(`/api/zones/${zoneId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }).then(async response => {
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update zone status');
          }
          return response.json();
        }),
        'Обновление статуса зоны...',
      );

      // Обновляем состояние в сторе
      updateZoneStatus(zoneId, newStatus);

      showSuccessToast(
        'Статус обновлен',
        `Статус зоны успешно изменен на ${newStatus}`
      );
    } catch (error) {
      console.error('Ошибка при обновлении статуса зоны:', error);
      showErrorToast(
        'Ошибка',
        error instanceof Error
          ? error.message
          : 'Произошла ошибка при обновлении статуса'
      );
      throw error;
    }
  },

  refreshZones: async (toast) => {
    const { fetchZones } = useZonesStore.getState();
    const showErrorToast = createErrorToast(toast);

    try {
      await fetchZones("DMP_MANAGER");
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
export const useDmpManagerZones = () => {
  // Получаем состояние и методы из базового стора
  const baseStore = useZonesStore();
  
  // Получаем методы из стора DMP-менеджера
  const dmpStore = useDmpManagerZonesStore();
  
  // Получаем toast
  const toast = useToast();

  // Объединяем их в один объект и создаем обертки для методов, требующих toast
  return {
    ...baseStore,
    ...dmpStore,
    changeZoneStatus: (zoneId: string, newStatus: ZoneStatus) => 
      dmpStore.changeZoneStatus(zoneId, newStatus, toast),
    refreshZones: () => dmpStore.refreshZones(toast),
  };
};
