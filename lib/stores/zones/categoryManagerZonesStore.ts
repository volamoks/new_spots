"use client";

import { create } from 'zustand';
// Import the NEW primary zones store
import { useZonesStore } from '../zonesStore';
// Import the NEW booking actions store
import { useBookingActionsStore } from '../bookingActionsStore';
// Keep hooks for dependencies
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
// Import SimplifiedUser type if needed by createBookingRequest
import type { SimplifiedUser } from '../bookingActionsStore';
// Import shared toast helpers and types
import { createErrorToast } from '@/lib/utils/toastUtils';
import type { UseToastReturn } from '@/lib/utils/toastUtils';

// Define types for injected dependencies
// type ToastFunction = (options: { title: string; description: string; variant?: 'default' | 'destructive' }) => void; // Removed

// Helper for error toast (consider moving to utils)
// const createErrorToast = (toast: { toast: ToastFunction }) => (title: string, description: string) => { // Removed
//   toast.toast({ title, description, variant: "destructive" }); // Removed
// }; // Removed

// Define the state containing only the CM-specific actions
// Update action signatures to use UseToastReturn type
interface CategoryManagerActionsState {
  refreshZones: (toast: UseToastReturn) => Promise<void>;
  // createBooking is now handled by bookingActionsStore
  // Selection state is handled by zonesStore (general) or bookingActionsStore (creation)
}

// Create the store containing only actions
export const useCategoryManagerActionsStore = create<CategoryManagerActionsState>(() => ({

  refreshZones: async (toast) => {
    const showErrorToast = createErrorToast(toast);
    // Get fetch action from the primary store
    const fetchZonesPrimary = useZonesStore.getState().fetchZones;

    try {
      // Fetch zones appropriate for CM (API might handle role implicitly or need a param)
      await fetchZonesPrimary();
    } catch (error) {
      console.error('Ошибка при обновлении зон:', error);
      const message = error instanceof Error ? error.message : 'Произошла ошибка при обновлении зон';
      showErrorToast('Ошибка', message);
    }
  },
}));

// Composition Hook: Combines state from primary stores and actions from this store
export const useCategoryManagerData = () => {
  // Get state and basic actions from the primary zones store
  const zonesDataStore = useZonesStore();

  // Get state and actions related to booking creation
  const bookingActions = useBookingActionsStore();

  // Get CM-specific actions
  const cmActionsStore = useCategoryManagerActionsStore();

  // Get dependencies
  const { data: session } = useSession();
  const toast = useToast();

  // Prepare user object for createBookingRequest
  // Ensure SimplifiedUser matches the type expected by bookingActionsStore
  const userForBooking: SimplifiedUser | null = session?.user
    ? { id: session.user.id, role: session.user.role /* Add other needed fields */ }
    : null;

  // Combine state and wrapped actions
  return {
    // State and basic actions from primary zones store
    ...zonesDataStore,

    // State and actions from booking actions store (relevant for CM)
    selectedZonesForCreation: bookingActions.selectedZonesForCreation,
    selectedSupplierInnForCreation: bookingActions.selectedSupplierInnForCreation,
    isCreatingBooking: bookingActions.isCreating, // Renamed for clarity
    createBookingError: bookingActions.createError,
    setSelectedZonesForCreation: bookingActions.setSelectedZonesForCreation,
    addSelectedZoneForCreation: bookingActions.addSelectedZoneForCreation,
    removeSelectedZoneForCreation: bookingActions.removeSelectedZoneForCreation,
    clearSelectedZonesForCreation: bookingActions.clearSelectedZonesForCreation,
    setSelectedSupplierInnForCreation: bookingActions.setSelectedSupplierInnForCreation,
    // Wrap createBookingRequest to inject the user object
    createBookingRequest: async () => {
      if (!userForBooking) {
        console.error("User not available for booking creation.");
        // Optionally show a toast error
        createErrorToast(toast)('Ошибка', 'Пользователь не авторизован.');
        return false;
      }
      return bookingActions.createBookingRequest(userForBooking);
    },


    // Wrapped CM-specific actions
    refreshZones: () => cmActionsStore.refreshZones(toast),

    // Other relevant data
    userCategory: session?.user?.category,
  };
};
