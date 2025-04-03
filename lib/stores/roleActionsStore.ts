"use client";

import React from 'react'; // Import React for hooks
import { create } from 'zustand';
import { useSession } from 'next-auth/react';
import { useZonesStore, ZonesState } from './zonesStore'; // Import ZonesState
import { useBookingActionsStore, SimplifiedUser, BookingActionsState } from './bookingActionsStore'; // Import BookingActionsState
// Remove useLoaderStore import
// import { useLoaderStore } from './loaderStore';
import { ZoneStatus, Zone } from '../../types/zone'; // Adjusted path, added Zone type
import { createSuccessToast, createErrorToast, UseToastReturn } from '../utils/toastUtils'; // Adjusted path
import { useToast } from '../../components/ui/use-toast'; // Assuming shadcn/ui toast
// Import the new utility and ApiError
import { fetchWithLoading } from '@/lib/utils/api'; // Adjust path if necessary, removed ApiError

// Interface for the state/actions provided by the role store
interface RoleActionsState {
  // Common actions
  refreshZones: () => Promise<void>;

  // DMP specific actions (optional)
  changeZoneStatus?: (zoneId: string, newStatus: ZoneStatus) => Promise<boolean>;
  bulkUpdateZoneStatus?: (zoneIds: string[], newStatus: ZoneStatus) => Promise<boolean>;
  bulkDeleteZones?: (zoneIds: string[]) => Promise<boolean>; // Removed newStatus, likely just deletion
  updateZoneField?: (zoneId: string, field: keyof Pick<Zone, 'supplier' | 'brand' | 'category'>, value: string | null) => Promise<boolean>; // Use Zone keys

  // CM specific actions (optional)
  createBookingRequest?: (user: SimplifiedUser) => Promise<boolean>;
  // CM might also need updateZoneField
  // updateZoneField?: (zoneId: string, field: keyof Pick<Zone, 'supplier' | 'brand' | 'category'>, value: string | null) => Promise<boolean>;

  // Supplier specific actions (optional) - Add if any unique supplier actions exist beyond refreshZones
}

// Type for dependencies passed to the factory
interface RoleActionsDependencies {
  zonesStore: ZonesState; // Use the actual state type
  bookingActionsStore: BookingActionsState; // Use the actual state type
  toast: UseToastReturn;
  // Remove withLoading dependency
  // withLoading: <T>(promise: Promise<T>, message: string, key?: string) => Promise<T>;
  user?: { id: string; role: string; category?: string | null; inn?: string | null }; // Allow null for category/inn
}

// Factory function to create the role-specific store instance
export const createRoleActionsStore = (
  role: 'dmp' | 'supplier' | 'categoryManager',
  dependencies: RoleActionsDependencies
) => create<RoleActionsState>(() => { // Removed unused set/get
  // Remove withLoading from dependencies
  const { zonesStore, bookingActionsStore, toast, user } = dependencies;
  const showSuccessToast = createSuccessToast(toast);
  const showErrorToast = createErrorToast(toast);

  // --- Base Actions (Common to Roles) ---
  const baseActions: Pick<RoleActionsState, 'refreshZones'> = {
    refreshZones: async () => {
      // const key = `refreshZones-${role}-${user?.id ?? 'guest'}`; // Key might not be needed if fetchWithLoading handles deduplication internally, or keep if needed for UI logic
      try {
        // Set role-specific filters before fetching
        if (role === 'supplier' && user?.inn) {
          // Ensure AVAILABLE is a valid ZoneStatus enum member if used
          zonesStore.setFilterCriteria({ supplier: [user.inn] /*, status: ZoneStatus.AVAILABLE */ }); // Assuming supplier filter takes array now
        } else if (role === 'categoryManager' && user?.category) {
          zonesStore.setFilterCriteria({ category: user.category });
        } else if (role === 'dmp') {
          zonesStore.clearSpecificFilters(['supplier', 'category']); // Example
        }
        // Call fetchZones directly - it now uses fetchWithLoading internally
        await zonesStore.fetchZones();
        // Success toast can be shown here, or potentially within fetchZones itself if desired
        showSuccessToast('Зоны обновлены', 'Список зон успешно обновлён');
      } catch (error) {
        // Error handling might be partially done within fetchZones/fetchWithLoading
        // Keep this for specific UI feedback if needed
        console.error("Error refreshing zones:", error);
        showErrorToast('Ошибка обновления зон', error instanceof Error ? error.message : 'Не удалось обновить список зон');
      }
    },
  };

  // --- DMP Actions ---
  const dmpActions: Partial<RoleActionsState> = role === 'dmp' ? {
    changeZoneStatus: async (zoneId, newStatus) => {
      // const key = `changeZoneStatus-${zoneId}`; // Key might not be needed
      const zonesState = zonesStore.getState(); // Get current state once
      const originalZone = zonesState.zones.find((z: Zone) => z.id === zoneId);
      if (!originalZone) {
        showErrorToast('Ошибка', 'Зона не найдена локально.');
        return false;
      }
      const originalStatus = originalZone.status;
      zonesState.updateZoneLocally(zoneId, { status: newStatus }); // Optimistic update
      try {
        // Use fetchWithLoading directly
        await fetchWithLoading(
          `/api/zones/${zoneId}/status`,
          'PATCH',
          'Обновление статуса зоны...',
          { status: newStatus }
        );
        showSuccessToast('Статус обновлён', `Статус зоны ${originalZone.uniqueIdentifier} изменён на ${newStatus}`);
        return true;
      } catch (error) {
        console.error("Error changing zone status:", error);
        zonesState.updateZoneLocally(zoneId, { status: originalStatus }); // Rollback
        showErrorToast('Ошибка обновления статуса', error instanceof Error ? error.message : 'Не удалось изменить статус зоны');
        return false;
      }
    },
    bulkUpdateZoneStatus: async (zoneIds, newStatus) => {
      // const key = `bulkUpdateStatus-${newStatus}-${zoneIds.length}`; // Key might not be needed
      const zonesState = zonesStore.getState();
      const originalZones = zonesState.zones.filter((z: Zone) => zoneIds.includes(z.id));
      const originalStatuses = new Map(originalZones.map((z: Zone) => [z.id, z.status]));
      if (originalZones.length !== zoneIds.length) {
        showErrorToast('Ошибка', 'Некоторые зоны для массового обновления не найдены.');
        return false;
      }
      zoneIds.forEach(id => zonesState.updateZoneLocally(id, { status: newStatus })); // Optimistic update
      try {
        // Use fetchWithLoading directly
        await fetchWithLoading(
          `/api/zones/bulk-update`, // Assuming this is the correct endpoint now
          'PATCH', // Or POST depending on API design
          `Обновление статуса ${zoneIds.length} зон...`,
          { zoneIds, status: newStatus }
        );
        showSuccessToast('Статусы обновлены', `Статус ${zoneIds.length} зон изменён на ${newStatus}`);
        // Clear selection after successful bulk update
        zonesState.clearSelection();
        return true;
      } catch (error) {
        console.error("Error bulk updating zone status:", error);
        zoneIds.forEach(id => { // Rollback
          const originalStatus = originalStatuses.get(id);
          if (originalStatus) {
            zonesState.updateZoneLocally(id, { status: originalStatus });
          }
        });
        showErrorToast('Ошибка массового обновления', error instanceof Error ? error.message : 'Не удалось изменить статус зон');
        return false;
      }
    },
    bulkDeleteZones: async (zoneIds) => {
      // const key = `bulkDeleteZones-${zoneIds.length}`; // Key might not be needed
      const zonesState = zonesStore.getState();
      const zonesToRemove = zonesState.zones.filter((z: Zone) => zoneIds.includes(z.id));
      const originalTotalCount = zonesState.totalCount;

      zonesState.removeZonesLocally(zoneIds); // Optimistic remove

      try {
        // Use fetchWithLoading directly
        await fetchWithLoading(
          `/api/zones/bulk-delete`,
          'DELETE', // Assuming DELETE method
          `Удаление ${zoneIds.length} зон...`,
          { zoneIds } // Send IDs in the body for DELETE
        );
        showSuccessToast('Зоны удалены', `${zoneIds.length} зон успешно удалены`);
        // No need to manually restore on success, removeZonesLocally was optimistic
        // Clear selection after successful bulk delete
        zonesState.clearSelection();
        return true;
      } catch (error) {
        console.error("Error bulk deleting zones:", error);
        showErrorToast('Ошибка удаления', error instanceof Error ? error.message : 'Не удалось удалить зоны. Список может быть неактуален.');
        // Simple restore attempt on error
        zonesStore.setState({ zones: [...zonesState.zones, ...zonesToRemove], totalCount: originalTotalCount });
        // Consider forcing a full refresh on error for deletions?
        // await baseActions.refreshZones(); // Call the base action
        return false;
      }
    },
    updateZoneField: async (zoneId, field, value) => {
      // const key = `updateZoneField-${zoneId}-${field}`; // Key might not be needed
      const zonesState = zonesStore.getState();
      const originalZone = zonesState.zones.find((z: Zone) => z.id === zoneId);
      if (!originalZone) {
        showErrorToast('Ошибка', 'Зона не найдена локально.');
        return false;
      }
      const originalValue = originalZone[field];
      // Optimistic update - also update status if logic requires (e.g., becomes unavailable)
      const updates: Partial<Zone> = { [field]: value };
      // Example: if (field === 'supplier' || field === 'brand') { updates.status = ZoneStatus.UNAVAILABLE; }
      zonesState.updateZoneLocally(zoneId, updates);

      try {
        // Use fetchWithLoading directly
        // Assuming endpoint is /api/zones/[id] for general updates
        await fetchWithLoading(
          `/api/zones/${zoneId}`, // Adjust endpoint if there's a specific one like /field
          'PATCH',
          `Обновление поля ${field} для зоны...`,
          { [field]: value } // Send only the updated field
        );
        showSuccessToast('Поле обновлено', `Поле '${field}' для зоны ${originalZone.uniqueIdentifier} обновлено.`);
        return true;
      } catch (error) {
        console.error(`Error updating zone field ${field}:`, error);
        // Rollback both field and status if status was changed optimistically
        const rollbackUpdates: Partial<Zone> = { [field]: originalValue };
        // Example: if (field === 'supplier' || field === 'brand') { rollbackUpdates.status = originalZone.status; }
        zonesState.updateZoneLocally(zoneId, rollbackUpdates);
        showErrorToast('Ошибка обновления поля', error instanceof Error ? error.message : `Не удалось обновить поле '${field}'`);
        return false;
      }
    },
  } : {};

  // --- Category Manager Actions ---
  const cmActions: Partial<RoleActionsState> = role === 'categoryManager' ? {
    createBookingRequest: async (creatingUser) => {
      // This action delegates to bookingActionsStore, which now uses fetchWithLoading.
      // So, we just need to call it and handle the success/failure locally for toasts/updates.
      const bookingState = bookingActionsStore.getState();
      try {
        const success = await bookingState.createBookingRequest(creatingUser);

        if (success) {
          // Get the IDs from the Set (which should be cleared by the successful action)
          // const bookedZoneIds = Array.from(bookingState.selectedZonesForCreation); // This state is cleared inside the action now
          // Update status locally in zonesStore - This might be redundant if createBookingRequest already triggers a zone refresh
          // bookedZoneIds.forEach(id => zonesStore.getState().updateZoneLocally(id, { status: ZoneStatus.BOOKED }));
          // bookingState.clearSelectedZonesForCreation(); // Already cleared inside the action
          showSuccessToast('Заявка создана', 'Заявка на бронирование успешно создана'); // Toast might be redundant if shown inside action
          return true;
        } else {
          // Error toast is likely shown inside createBookingRequest now
          showErrorToast('Ошибка создания заявки', bookingState.createError || 'Не удалось создать заявку на бронирование.');
          return false;
        }
      } catch (error) {
        // Catch any unexpected errors during the delegation/handling process
        console.error("Error during booking request creation process:", error);
        showErrorToast('Ошибка создания заявки', error instanceof Error ? error.message : 'Произошла непредвиденная ошибка');
        return false;
      }
    },
    // Reuse DMP's updateZoneField if CM has permission
    updateZoneField: dmpActions.updateZoneField,
  } : {};

  // --- Supplier Actions ---
  const supplierActions: Partial<RoleActionsState> = role === 'supplier' ? {
    // Add specific supplier actions here if needed
  } : {};


  // Combine all actions based on role
  return {
    ...baseActions,
    ...(role === 'dmp' ? dmpActions : {}),
    ...(role === 'categoryManager' ? cmActions : {}),
    ...(role === 'supplier' ? supplierActions : {}),
  };
});

// Hook to consume the role-specific data and actions
export const useRoleData = (role: 'dmp' | 'supplier' | 'categoryManager') => {
  // --- Get Base Stores ---
  const zonesStoreSelectors = useZonesStore();
  const bookingActionsSelectors = useBookingActionsStore();
  // Remove withLoading from loader store
  // const { withLoading } = useLoaderStore();
  const toast = useToast();
  const { data: session } = useSession();

  // --- Prepare Dependencies ---
  const user = React.useMemo(() => (
    session?.user
      ? { id: session.user.id, role: session.user.role, category: session.user.category, inn: session.user.inn }
      : undefined
  ), [session?.user]);

  // Ensure the types passed match RoleActionsDependencies (without withLoading)
  const dependencies: RoleActionsDependencies = React.useMemo(() => ({
    zonesStore: zonesStoreSelectors,
    bookingActionsStore: bookingActionsSelectors,
    toast,
    // Remove withLoading
    // withLoading,
    user,
  }), [zonesStoreSelectors, bookingActionsSelectors, toast, user]); // Remove withLoading from dependency array

  // --- Create Role Actions Store Hook Instance ---
  // Memoize the hook creation itself
  const useRoleActions = React.useMemo(() => {
    return createRoleActionsStore(role, dependencies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, dependencies]); // Dependencies updated

  // Use the created store hook to get the actions/state from this specific instance
  const actions = useRoleActions();

  // --- Combine and Return Data/Actions ---
  return {
    // Zones state and base actions
    ...zonesStoreSelectors,

    // Booking creation state/actions (relevant for CM and potentially DMP)
    ...(role === 'dmp' || role === 'categoryManager' ? {
      selectedZonesForCreation: bookingActionsSelectors.selectedZonesForCreation, // Type is Set<string>
      selectedSupplierInnForCreation: bookingActionsSelectors.selectedSupplierInnForCreation,
      selectedBrandId: bookingActionsSelectors.selectedBrandId, // Pass through brand ID state
      // isCreatingBooking: bookingActionsSelectors.isCreating, // Removed - loading handled globally
      createBookingError: bookingActionsSelectors.createError,
      // Ensure correct types for Set based actions if needed, though direct pass-through is fine
      setSelectedZonesForCreation: bookingActionsSelectors.setSelectedZonesForCreation,
      addSelectedZoneForCreation: bookingActionsSelectors.addSelectedZoneForCreation,
      removeSelectedZoneForCreation: bookingActionsSelectors.removeSelectedZoneForCreation,
      clearSelectedZonesForCreation: bookingActionsSelectors.clearSelectedZonesForCreation,
      setSelectedSupplierInnForCreation: bookingActionsSelectors.setSelectedSupplierInnForCreation,
      setSelectedBrandId: bookingActionsSelectors.setSelectedBrandId, // Pass through brand ID action
    } : {}),

    // Actions specific to the role
    ...actions,
  };
};