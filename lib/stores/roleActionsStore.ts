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
  // Zones Store Functions
  getZonesState: () => ZonesState;
  setZonesState: (partial: Partial<ZonesState> | ((state: ZonesState) => Partial<ZonesState>)) => void;
  setFilterCriteria: ZonesState['setFilterCriteria'];
  clearSpecificFilters: ZonesState['clearSpecificFilters'];
  fetchZones: ZonesState['fetchZones'];
  updateZoneLocally: ZonesState['updateZoneLocally'];
  clearSelection: ZonesState['clearSelection'];
  removeZonesLocally: ZonesState['removeZonesLocally'];
  // Booking Actions Store Functions
  getBookingActionsState: () => BookingActionsState;
  createBookingRequestAction: BookingActionsState['createBookingRequest']; // Renamed to avoid conflict
  // Other Dependencies
  toast: UseToastReturn;
  user?: { id: string; role: string; category?: string | null; inn?: string | null };
}

// Factory function to create the role-specific store instance
export const createRoleActionsStore = (
  role: 'dmp' | 'supplier' | 'categoryManager',
  dependencies: RoleActionsDependencies
) => create<RoleActionsState>(() => { // Removed unused set/get
  // Remove withLoading from dependencies
  // Destructure the passed functions and other dependencies
  const {
    // Zones Store Functions
    getZonesState, setZonesState, setFilterCriteria, clearSpecificFilters, fetchZones,
    updateZoneLocally, clearSelection, removeZonesLocally,
    // Booking Actions Store Functions
    getBookingActionsState, createBookingRequestAction,
    // Other Dependencies
    toast, user
  } = dependencies;
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
          setFilterCriteria({ supplier: [user.inn] /*, status: ZoneStatus.AVAILABLE */ }); // Use passed function
        } else if (role === 'categoryManager' && user?.category) {
          setFilterCriteria({ category: user.category }); // Use passed function
        } else if (role === 'dmp') {
          clearSpecificFilters(['supplier', 'category']); // Use passed function
        }
        // Call fetchZones directly - it now uses fetchWithLoading internally
        await fetchZones(); // Use passed function
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
      const zonesState = getZonesState(); // Use passed function
      const originalZone = zonesState.zones.find((z: Zone) => z.id === zoneId);
      if (!originalZone) {
        showErrorToast('Ошибка', 'Зона не найдена локально.');
        return false;
      }
      const originalStatus = originalZone.status;

      // Optimistic update: Include clearing fields if status is AVAILABLE
      const optimisticUpdates: Partial<Zone> = { status: newStatus };
      if (newStatus === ZoneStatus.AVAILABLE) {
        optimisticUpdates.supplier = null;
        optimisticUpdates.brand = null;
      }
      updateZoneLocally(zoneId, optimisticUpdates); // Use passed function

      try {
        // Use fetchWithLoading directly
        // Prepare payload: Include null fields if status is AVAILABLE
        const payload: { status: ZoneStatus; supplier?: null; brand?: null } = { status: newStatus };
        if (newStatus === ZoneStatus.AVAILABLE) {
          payload.supplier = null;
          payload.brand = null;
        }
        // Assuming the status endpoint or main zone endpoint can handle these fields
        await fetchWithLoading(
          `/api/zones/${zoneId}`, // Using main endpoint assuming it handles PATCH for multiple fields
          'PATCH',
          'Обновление статуса зоны...',
          payload // Send status and potentially null fields
        );
        showSuccessToast('Статус обновлён', `Статус зоны ${originalZone.uniqueIdentifier} изменён на ${newStatus}`);
        return true;
      } catch (error) {
        console.error("Error changing zone status:", error);
        // Rollback: Restore original status and potentially original supplier/brand if they were cleared optimistically
        const rollbackUpdates: Partial<Zone> = { status: originalStatus };
        if (newStatus === ZoneStatus.AVAILABLE && originalZone) { // Check if originalZone exists
          rollbackUpdates.supplier = originalZone.supplier;
          rollbackUpdates.brand = originalZone.brand;
        }
        updateZoneLocally(zoneId, rollbackUpdates); // Use passed function (Rollback)
        showErrorToast('Ошибка обновления статуса', error instanceof Error ? error.message : 'Не удалось изменить статус зоны');
        return false;
      }
    },
    bulkUpdateZoneStatus: async (zoneIds, newStatus) => {
      // const key = `bulkUpdateStatus-${newStatus}-${zoneIds.length}`; // Key might not be needed
      const zonesState = getZonesState(); // Use passed function
      const originalZones = zonesState.zones.filter((z: Zone) => zoneIds.includes(z.id)); // Keep original zone data for rollback
      // Removed unused originalStatuses variable
      if (originalZones.length !== zoneIds.length) {
        showErrorToast('Ошибка', 'Некоторые зоны для массового обновления не найдены.');
        return false;
      }

      // Optimistic update: Include clearing fields if status is AVAILABLE
      const optimisticBulkUpdates: Partial<Zone> = { status: newStatus };
      if (newStatus === ZoneStatus.AVAILABLE) {
        optimisticBulkUpdates.supplier = null;
        optimisticBulkUpdates.brand = null;
      }
      zoneIds.forEach(id => updateZoneLocally(id, optimisticBulkUpdates)); // Use passed function

      try {
        // Use fetchWithLoading directly
        // Prepare payload: Include null fields if status is AVAILABLE
        const bulkPayload: { zoneIds: string[]; status: ZoneStatus; supplier?: null; brand?: null } = { zoneIds, status: newStatus };
        if (newStatus === ZoneStatus.AVAILABLE) {
          bulkPayload.supplier = null;
          bulkPayload.brand = null;
        }
        await fetchWithLoading(
          `/api/zones/bulk-update`,
          'POST', // Correct HTTP method
          `Обновление статуса ${zoneIds.length} зон...`,
          bulkPayload // Send IDs, status, and potentially null fields
        );
        showSuccessToast('Статусы обновлены', `Статус ${zoneIds.length} зон изменён на ${newStatus}`);
        // Clear selection after successful bulk update
        clearSelection(); // Use passed function
        return true;
      } catch (error) {
        console.error("Error bulk updating zone status:", error);
        // Rollback: Restore original status and potentially original supplier/brand
        zoneIds.forEach(id => {
          const originalZone = originalZones.find(z => z.id === id); // Find the original zone data
          if (originalZone) {
            const rollbackBulkUpdates: Partial<Zone> = { status: originalZone.status };
            if (newStatus === ZoneStatus.AVAILABLE) { // If we were trying to set to AVAILABLE
              rollbackBulkUpdates.supplier = originalZone.supplier; // Restore original supplier
              rollbackBulkUpdates.brand = originalZone.brand; // Restore original brand
            }
            updateZoneLocally(id, rollbackBulkUpdates); // Use passed function
          }
        });
        showErrorToast('Ошибка массового обновления', error instanceof Error ? error.message : 'Не удалось изменить статус зон');
        return false;
      }
    },
    bulkDeleteZones: async (zoneIds) => {
      // const key = `bulkDeleteZones-${zoneIds.length}`; // Key might not be needed
      const zonesState = getZonesState(); // Use passed function
      const zonesToRemove = zonesState.zones.filter((z: Zone) => zoneIds.includes(z.id));
      const originalTotalCount = zonesState.totalCount;

      removeZonesLocally(zoneIds); // Use passed function (Optimistic remove)

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
        clearSelection(); // Use passed function
        return true;
      } catch (error) {
        console.error("Error bulk deleting zones:", error);
        showErrorToast('Ошибка удаления', error instanceof Error ? error.message : 'Не удалось удалить зоны. Список может быть неактуален.');
        // Simple restore attempt on error
        // Use passed setState function for restore attempt
        setZonesState({ zones: [...zonesState.zones, ...zonesToRemove], totalCount: originalTotalCount });
        // Consider forcing a full refresh on error for deletions?
        // await baseActions.refreshZones(); // Call the base action
        return false;
      }
    },
    updateZoneField: async (zoneId, field, value) => {
      // const key = `updateZoneField-${zoneId}-${field}`; // Key might not be needed
      const zonesState = getZonesState(); // Use passed function
      const originalZone = zonesState.zones.find((z: Zone) => z.id === zoneId);
      if (!originalZone) {
        showErrorToast('Ошибка', 'Зона не найдена локально.');
        return false;
      }
      const originalValue = originalZone[field];
      // Optimistic update - also update status if logic requires (e.g., becomes unavailable)
      const updates: Partial<Zone> = { [field]: value };
      // Example: if (field === 'supplier' || field === 'brand') { updates.status = ZoneStatus.UNAVAILABLE; }
      updateZoneLocally(zoneId, updates); // Use passed function

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
        updateZoneLocally(zoneId, rollbackUpdates); // Use passed function (Rollback)
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
      const bookingState = getBookingActionsState(); // Use passed function to get state if needed for error message etc.
      try {
        // Use the passed action directly
        const success = await createBookingRequestAction(creatingUser);

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

  // Prepare dependencies with specific functions from both stores
  // Memoize dependencies, ensuring stability by depending on stable function refs from stores
  const dependencies: RoleActionsDependencies = React.useMemo(() => ({
    // Zones Store Functions (Get stable references directly)
    getZonesState: useZonesStore.getState,
    setZonesState: useZonesStore.setState,
    setFilterCriteria: useZonesStore.getState().setFilterCriteria, // Get stable ref via getState
    clearSpecificFilters: useZonesStore.getState().clearSpecificFilters,
    fetchZones: useZonesStore.getState().fetchZones,
    updateZoneLocally: useZonesStore.getState().updateZoneLocally,
    clearSelection: useZonesStore.getState().clearSelection,
    removeZonesLocally: useZonesStore.getState().removeZonesLocally,
    // Booking Actions Store Functions
    getBookingActionsState: useBookingActionsStore.getState,
    createBookingRequestAction: useBookingActionsStore.getState().createBookingRequest, // Get stable ref via getState
    // Other Dependencies
    toast,
    user,
    // Depend on the stable function references and other stable values
  }), [toast, user]); // Removed store selectors from dependency array

  // --- Create Role Actions Store Hook Instance ---
  // Memoize the hook creation itself
  const useRoleActions = React.useMemo(() => {
    return createRoleActionsStore(role, dependencies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, dependencies]); // Dependencies updated

  // Use the created store hook to get the actions/state from this specific instance
  const actions = useRoleActions();

  // --- Combine and Return Data/Actions ---
  // Return a more stable object by selecting specific properties
  // instead of spreading the entire zonesStoreSelectors
  return {
    // State from zonesStore needed by components
    isLoading: zonesStoreSelectors.isLoading,
    isLoadingFilters: zonesStoreSelectors.isLoadingFilters, // Keep if needed for UI indicators
    zones: zonesStoreSelectors.zones, // Needed by ZonesTable
    totalCount: zonesStoreSelectors.totalCount, // Needed by ZonesSummaryCard, ZonesTable pagination
    selectedZoneIds: zonesStoreSelectors.selectedZoneIds, // Needed by DmpManagerZonesPage, ZonesTable
    filterCriteria: zonesStoreSelectors.filterCriteria, // Needed by ZonesFilters, InteractiveZoneFilters
    sortCriteria: zonesStoreSelectors.sortCriteria, // Needed by ZonesTable
    paginationCriteria: zonesStoreSelectors.paginationCriteria, // Needed by ZonesTable
    uniqueFilterValues: zonesStoreSelectors.uniqueFilterValues, // Needed by InteractiveZoneFilters
    error: zonesStoreSelectors.error, // Potentially for display
    filtersError: zonesStoreSelectors.filtersError, // Potentially for display

    // Actions from zonesStore needed by components (use stable refs from dependencies or getState)
    fetchZones: dependencies.fetchZones,
    fetchFilterOptions: useZonesStore.getState().fetchFilterOptions, // Get stable ref
    setFilterCriteria: dependencies.setFilterCriteria,
    setSortCriteria: useZonesStore.getState().setSortCriteria, // Get stable ref
    setPaginationCriteria: useZonesStore.getState().setPaginationCriteria, // Get stable ref
    toggleZoneSelection: useZonesStore.getState().toggleZoneSelection, // Get stable ref
    toggleSelectAll: useZonesStore.getState().toggleSelectAll, // Get stable ref
    clearSelection: dependencies.clearSelection,
    updateZoneLocally: dependencies.updateZoneLocally,
    removeZonesLocally: dependencies.removeZonesLocally,
    clearSpecificFilters: dependencies.clearSpecificFilters,
    resetFilters: useZonesStore.getState().resetFilters, // Get stable ref

    // Booking creation state/actions (relevant for CM and potentially DMP)
    ...(role === 'dmp' || role === 'categoryManager' ? {
      selectedZonesForCreation: bookingActionsSelectors.selectedZonesForCreation,
      selectedSupplierInnForCreation: bookingActionsSelectors.selectedSupplierInnForCreation,
      selectedBrandId: bookingActionsSelectors.selectedBrandId,
      createBookingError: bookingActionsSelectors.createError,
      setSelectedZonesForCreation: bookingActionsSelectors.setSelectedZonesForCreation,
      addSelectedZoneForCreation: bookingActionsSelectors.addSelectedZoneForCreation,
      removeSelectedZoneForCreation: bookingActionsSelectors.removeSelectedZoneForCreation,
      clearSelectedZonesForCreation: bookingActionsSelectors.clearSelectedZonesForCreation,
      setSelectedSupplierInnForCreation: bookingActionsSelectors.setSelectedSupplierInnForCreation,
      setSelectedBrandId: bookingActionsSelectors.setSelectedBrandId,
    } : {}),

    // Actions specific to the role (defined within createRoleActionsStore)
    ...actions,
  };
};