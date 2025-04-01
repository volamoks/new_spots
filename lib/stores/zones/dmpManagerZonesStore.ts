"use client";

import { create } from 'zustand';
// Import the NEW primary zones store
import { useZonesStore } from '../zonesStore';
import { ZoneStatus } from '@/types/zone';
// Import the standardized loader store
import { useLoaderStore } from '../loaderStore';
import { useToast } from '@/components/ui/use-toast';
// Import shared toast helpers and types
import { createSuccessToast, createErrorToast } from '@/lib/utils/toastUtils';
import type { UseToastReturn } from '@/lib/utils/toastUtils';

// Define types for injected dependencies (toast and loader)
// type ToastFunction = (options: { title: string; description: string; variant?: 'default' | 'destructive' }) => void; // Removed
type WithLoadingFunction = <T>(promise: Promise<T>, message?: string) => Promise<T>;

// Define the state containing only the DMP-specific actions
// Update action signatures to use UseToastReturn type for toast parameter
interface DmpManagerActionsState {
  changeZoneStatus: (zoneId: string, newStatus: ZoneStatus, toast: UseToastReturn, withLoading: WithLoadingFunction) => Promise<boolean>;
  refreshZones: (toast: UseToastReturn) => Promise<void>;
  bulkUpdateZoneStatus: (zoneIds: string[], newStatus: ZoneStatus, toast: UseToastReturn, withLoading: WithLoadingFunction) => Promise<boolean>;
  bulkDeleteZones: (zoneIds: string[], toast: UseToastReturn, withLoading: WithLoadingFunction) => Promise<boolean>;
  updateZoneField: (zoneId: string, field: 'supplier' | 'brand', value: string | null, toast: UseToastReturn, withLoading: WithLoadingFunction) => Promise<boolean>;
}

// Helper functions for toasts (consider moving to a dedicated UI utility file)
// const createSuccessToast = (toast: { toast: ToastFunction }) => (title: string, description: string) => { // Removed
//   toast.toast({ title, description }); // Removed
// }; // Removed
// const createErrorToast = (toast: { toast: ToastFunction }) => (title: string, description: string) => { // Removed
//   toast.toast({ title, description, variant: "destructive" }); // Removed
// }; // Removed

// Create the store containing only actions
export const useDmpManagerActionsStore = create<DmpManagerActionsState>(() => ({

  changeZoneStatus: async (zoneId, newStatus, toast, withLoading) => {
    const showSuccessToast = createSuccessToast(toast);
    const showErrorToast = createErrorToast(toast);
    // Get the action from the primary store
    const updateLocal = useZonesStore.getState().updateZoneLocally;

    try {
      await withLoading(
        fetch(`/api/zones/${zoneId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }).then(async response => {
          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to update zone status' }));
            throw new Error(error.error || 'Failed to update zone status');
          }
          return response.json();
        }),
        'Обновление статуса зоны...',
      );

      // Update state in the primary store
      updateLocal(zoneId, { status: newStatus });

      showSuccessToast('Статус обновлен', `Статус зоны успешно изменен на ${newStatus}`);
      return true;
    } catch (error) {
      console.error('Ошибка при обновлении статуса зоны:', error);
      const message = error instanceof Error ? error.message : 'Произошла ошибка при обновлении статуса';
      showErrorToast('Ошибка', message);
      // throw error; // Re-throwing might be useful depending on UI handling
      return false;
    }
  },

  refreshZones: async (toast) => {
    const showErrorToast = createErrorToast(toast);
    // Get fetch action from the primary store
    const fetchZonesPrimary = useZonesStore.getState().fetchZones;

    try {
      // No role needed if API doesn't require it for DMP
      await fetchZonesPrimary();
    } catch (error) {
      console.error('Ошибка при обновлении зон:', error);
      const message = error instanceof Error ? error.message : 'Произошла ошибка при обновлении зон';
      showErrorToast('Ошибка', message);
    }
  },

  bulkUpdateZoneStatus: async (zoneIds, newStatus, toast, withLoading) => {
    const showSuccessToast = createSuccessToast(toast);
    const showErrorToast = createErrorToast(toast);
    // Get actions from the primary store
    const updateLocal = useZonesStore.getState().updateZoneLocally;
    const clearSelectionPrimary = useZonesStore.getState().clearSelection;

    try {
      await withLoading(
        fetch(`/api/zones/bulk-update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zoneIds, status: newStatus }),
        }).then(async response => {
          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to bulk update zone statuses' }));
            throw new Error(error.error || 'Failed to bulk update zone statuses');
          }
          return response.json();
        }),
        `Обновление статуса ${zoneIds.length} зон...`,
      );

      // Update state in the primary store for each zone
      zoneIds.forEach(zoneId => updateLocal(zoneId, { status: newStatus }));
      clearSelectionPrimary(); // Clear selection in the primary store

      showSuccessToast('Статусы обновлены', `Статус ${zoneIds.length} зон успешно изменен на ${newStatus}`);
      return true;
    } catch (error) {
      console.error('Ошибка при массовом обновлении статусов зон:', error);
      const message = error instanceof Error ? error.message : 'Произошла ошибка при массовом обновлении статусов';
      showErrorToast('Ошибка обновления', message);
      return false;
    }
  },

  bulkDeleteZones: async (zoneIds, toast, withLoading) => {
    const showSuccessToast = createSuccessToast(toast);
    const showErrorToast = createErrorToast(toast);
    // Get actions from the primary store
    const fetchZonesPrimary = useZonesStore.getState().fetchZones;
    const clearSelectionPrimary = useZonesStore.getState().clearSelection;

    try {
      const result = await withLoading(
        fetch(`/api/zones/bulk-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zoneIds }),
        }).then(async response => {
          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to bulk delete zones' }));
            if (response.status === 409 && error.code === 'P2003') {
              throw new Error(`Невозможно удалить некоторые зоны, так как они используются в бронированиях.`);
            }
            throw new Error(error.error || 'Failed to bulk delete zones');
          }
          return response.json();
        }),
        `Удаление ${zoneIds.length} зон...`,
      );

      // Refresh the entire list from the primary store after deletion
      await fetchZonesPrimary();
      clearSelectionPrimary(); // Clear selection in the primary store

      showSuccessToast('Зоны удалены', `Успешно удалено ${result.count || zoneIds.length} зон.`);
      return true;
    } catch (error) {
      console.error('Ошибка при массовом удалении зон:', error);
      const message = error instanceof Error ? error.message : 'Произошла ошибка при массовом удалении зон';
      showErrorToast('Ошибка удаления', message);
      return false;
    }
  },

  updateZoneField: async (zoneId, field, value, toast, withLoading) => {
    const showSuccessToast = createSuccessToast(toast);
    const showErrorToast = createErrorToast(toast);
    // Get action from the primary store
    const updateLocal = useZonesStore.getState().updateZoneLocally;

    const fieldName = field === 'supplier' ? 'Поставщик' : 'Бренд';

    try {
      const updatedZone = await withLoading(
        fetch(`/api/zones/${zoneId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        }).then(async response => {
          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: `Failed to update zone ${field}` }));
            throw new Error(error.error || `Failed to update zone ${field}`);
          }
          return response.json();
        }),
        `Обновление поля "${fieldName}"...`,
      );

      // Update state in the primary store, including status change
      // Assuming status always becomes UNAVAILABLE after field update, adjust if needed
      updateLocal(zoneId, { [field]: value, status: ZoneStatus.UNAVAILABLE });

      showSuccessToast('Поле обновлено', `${fieldName} для зоны ${updatedZone.uniqueIdentifier || zoneId} успешно обновлен.`);
      return true;
    } catch (error) {
      console.error(`Ошибка при обновлении поля ${field} для зоны ${zoneId}:`, error);
      const message = error instanceof Error ? error.message : `Произошла ошибка при обновлении поля ${fieldName}`;
      showErrorToast('Ошибка обновления', message);
      return false;
    }
  },
}));

// Composition Hook: Combines state from primary store and actions from this store
export const useDmpManagerZones = () => {
  // Get state and basic actions from the NEW primary zones store
  const zonesDataStore = useZonesStore();

  // Get DMP-specific actions
  const dmpActionsStore = useDmpManagerActionsStore();

  // Get dependencies (toast, loader) - these hooks must be called within a React component context
  const toast = useToast();
  // Get withLoading from the standardized loader store's state
  const { withLoading } = useLoaderStore.getState();

  // Combine state and wrapped actions
  return {
    // State and basic actions from primary store
    ...zonesDataStore,

    // Wrapped DMP-specific actions with dependencies injected
    changeZoneStatus: (zoneId: string, newStatus: ZoneStatus) =>
      dmpActionsStore.changeZoneStatus(zoneId, newStatus, toast, withLoading),
    refreshZones: () => dmpActionsStore.refreshZones(toast),
    bulkUpdateZoneStatus: (zoneIds: string[], newStatus: ZoneStatus) =>
      dmpActionsStore.bulkUpdateZoneStatus(zoneIds, newStatus, toast, withLoading),
    bulkDeleteZones: (zoneIds: string[]) =>
      dmpActionsStore.bulkDeleteZones(zoneIds, toast, withLoading),
    updateZoneField: (zoneId: string, field: 'supplier' | 'brand', value: string | null) =>
      dmpActionsStore.updateZoneField(zoneId, field, value, toast, withLoading),
  };
};
