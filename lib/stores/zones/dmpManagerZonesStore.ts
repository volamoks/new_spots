"use client";

import { create } from 'zustand';
import { useZonesStore, createSuccessToast, createErrorToast } from './baseZonesStore';
import { ZoneStatus } from '@/types/zone';
import { useLoader } from '@/app/components/GlobalLoader';
import { useToast } from '@/components/ui/use-toast';

// Определяем тип для toast функции
type ToastFunction = (options: { title: string; description: string; variant?: 'default' | 'destructive' }) => void;
// Определяем тип для withLoading функции
type WithLoadingFunction = <T>(promise: Promise<T>, message?: string) => Promise<T>;

interface DmpManagerZonesState {
  // Дополнительные методы для DMP-менеджера
  // Добавляем withLoading в аргументы
  changeZoneStatus: (zoneId: string, newStatus: ZoneStatus, toast: { toast: ToastFunction }, withLoading: WithLoadingFunction) => Promise<void>;
  refreshZones: (toast: { toast: ToastFunction }) => Promise<void>; // withLoading не нужен
  bulkUpdateZoneStatus: (zoneIds: string[], newStatus: ZoneStatus, toast: { toast: ToastFunction }, withLoading: WithLoadingFunction) => Promise<void>;
  bulkDeleteZones: (zoneIds: string[], toast: { toast: ToastFunction }, withLoading: WithLoadingFunction) => Promise<void>;
  updateZoneField: (zoneId: string, field: 'supplier' | 'brand', value: string | null, toast: { toast: ToastFunction }, withLoading: WithLoadingFunction) => Promise<void>; // Добавлено
}

export const useDmpManagerZonesStore = create<DmpManagerZonesState>(() => ({
  // Методы для DMP-менеджера
  changeZoneStatus: async (zoneId, newStatus, toast, withLoading) => { // Принимаем withLoading
    const showSuccessToast = createSuccessToast(toast);
    const showErrorToast = createErrorToast(toast);
    // const { withLoading } = useLoader(); // Убираем вызов хука
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

  bulkUpdateZoneStatus: async (zoneIds, newStatus, toast, withLoading) => { // Принимаем withLoading
    const showSuccessToast = createSuccessToast(toast);
    const showErrorToast = createErrorToast(toast);
    // const { withLoading } = useLoader(); // Убираем вызов хука
    const { updateZoneStatus, clearSelection } = useZonesStore.getState();

    try {
      await withLoading(
        fetch(`/api/zones/bulk-update`, { // Новый API эндпоинт
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ zoneIds, status: newStatus }),
        }).then(async response => {
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to bulk update zone statuses');
          }
          return response.json(); // Ожидаем ответ с количеством обновленных зон
        }),
        `Обновление статуса ${zoneIds.length} зон...`,
      );

      // Обновляем состояние в сторе для каждой зоны
      zoneIds.forEach(zoneId => updateZoneStatus(zoneId, newStatus));
      clearSelection(); // Очищаем выбор после успеха

      showSuccessToast(
        'Статусы обновлены',
        `Статус ${zoneIds.length} зон успешно изменен на ${newStatus}`
      );
    } catch (error) {
      console.error('Ошибка при массовом обновлении статусов зон:', error);
      showErrorToast(
        'Ошибка обновления',
        error instanceof Error
          ? error.message
          : 'Произошла ошибка при массовом обновлении статусов'
      );
      throw error; // Пробрасываем ошибку для обработки в компоненте
    }
  },

  bulkDeleteZones: async (zoneIds, toast, withLoading) => { // Принимаем withLoading
    const showSuccessToast = createSuccessToast(toast);
    const showErrorToast = createErrorToast(toast);
    // const { withLoading } = useLoader(); // Убираем вызов хука
    const { setZones, clearSelection } = useZonesStore.getState(); // Нужен setZones для обновления списка

    try {
      const result = await withLoading(
        fetch(`/api/zones/bulk-delete`, { // Новый API эндпоинт
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ zoneIds }),
        }).then(async response => {
          if (!response.ok) {
            const error = await response.json();
            // Обработка ошибки внешнего ключа
            if (response.status === 409 && error.code === 'P2003') {
              throw new Error(`Невозможно удалить некоторые зоны, так как они используются в бронированиях.`);
            }
            throw new Error(error.error || 'Failed to bulk delete zones');
          }
          return response.json(); // Ожидаем ответ с количеством удаленных зон
        }),
        `Удаление ${zoneIds.length} зон...`,
      );

      // Обновляем состояние в сторе, удаляя зоны
      const currentState = useZonesStore.getState();
      const remainingZones = currentState.zones.filter(zone => !zoneIds.includes(zone.id));
      setZones(remainingZones); // Используем setZones для пересчета фильтров и уникальных значений
      clearSelection(); // Очищаем выбор после успеха

      showSuccessToast(
        'Зоны удалены',
        `Успешно удалено ${result.count || zoneIds.length} зон.` // Используем count из ответа API, если есть
      );
    } catch (error) {
      console.error('Ошибка при массовом удалении зон:', error);
      showErrorToast(
        'Ошибка удаления',
        error instanceof Error
          ? error.message
          : 'Произошла ошибка при массовом удалении зон'
      );
      throw error; // Пробрасываем ошибку для обработки в компоненте
    }
  },

  updateZoneField: async (zoneId, field, value, toast, withLoading) => {
    const showSuccessToast = createSuccessToast(toast);
    const showErrorToast = createErrorToast(toast);
    const { setZones } = useZonesStore.getState(); // Нужен setZones для обновления

    const fieldName = field === 'supplier' ? 'Поставщик' : 'Бренд';

    try {
      const updatedZone = await withLoading(
        fetch(`/api/zones/${zoneId}`, { // Используем PATCH эндпоинт
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ [field]: value }), // Динамически устанавливаем поле
        }).then(async response => {
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `Failed to update zone ${field}`);
          }
          return response.json();
        }),
        `Обновление поля "${fieldName}"...`,
      );

      // Обновляем состояние в сторе, включая статус
      const currentState = useZonesStore.getState();
      const updatedZones = currentState.zones.map(zone =>
        zone.id === zoneId ? { ...zone, [field]: value, status: ZoneStatus.UNAVAILABLE } : zone
      );
      setZones(updatedZones); // Используем setZones для пересчета

      showSuccessToast(
        'Поле обновлено',
        `${fieldName} для зоны ${updatedZone.uniqueIdentifier || zoneId} успешно обновлен.`
      );
    } catch (error) {
      console.error(`Ошибка при обновлении поля ${field} для зоны ${zoneId}:`, error);
      showErrorToast(
        'Ошибка обновления',
        error instanceof Error
          ? error.message
          : `Произошла ошибка при обновлении поля ${fieldName}`
      );
      throw error;
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

  // Получаем withLoading здесь
  const { withLoading } = useLoader();

  // Объединяем их в один объект и создаем обертки для методов, требующих toast
  return {
    ...baseStore,
    ...dmpStore,
    // Обертки для передачи toast и withLoading в методы
    changeZoneStatus: (zoneId: string, newStatus: ZoneStatus) =>
      dmpStore.changeZoneStatus(zoneId, newStatus, toast, withLoading),
    refreshZones: () => dmpStore.refreshZones(toast), // withLoading не нужен
    bulkUpdateZoneStatus: (zoneIds: string[], newStatus: ZoneStatus) =>
      dmpStore.bulkUpdateZoneStatus(zoneIds, newStatus, toast, withLoading),
    bulkDeleteZones: (zoneIds: string[]) =>
      dmpStore.bulkDeleteZones(zoneIds, toast, withLoading),
    updateZoneField: (zoneId: string, field: 'supplier' | 'brand', value: string | null) =>
      dmpStore.updateZoneField(zoneId, field, value, toast, withLoading), // Добавлена обертка
  };
};
