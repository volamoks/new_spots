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

// Define types for injected dependencies
type ToastFunction = (options: { title: string; description: string; variant?: 'default' | 'destructive' }) => void;

// Helper for error toast (consider moving to utils)
const createErrorToast = (toast: { toast: ToastFunction }) => (title: string, description: string) => {
  toast.toast({ title, description, variant: "destructive" });
};

// Define the state containing only the Supplier-specific actions
interface SupplierActionsState {
  refreshZones: (toast: { toast: ToastFunction }) => Promise<void>;
  // createBooking is now handled by bookingActionsStore
}

// Create the store containing only actions
export const useSupplierActionsStore = create<SupplierActionsState>(() => ({

  refreshZones: async (toast) => {
    const showErrorToast = createErrorToast(toast);
    // Get fetch action from the primary store
    const fetchZonesPrimary = useZonesStore.getState().fetchZones;

    try {
      // Fetch zones appropriate for Supplier (API might handle role implicitly or need a param)
      // If the API needs filtering by supplier INN, that logic should be added here or in fetchZonesPrimary
      await fetchZonesPrimary();
    } catch (error) {
      console.error('Ошибка при обновлении зон:', error);
      const message = error instanceof Error ? error.message : 'Произошла ошибка при обновлении зон';
      showErrorToast('Ошибка', message);
    }
  },
}));

// Composition Hook: Combines state from primary stores and actions from this store
export const useSupplierData = () => {
  // Get state and basic actions from the primary zones store
  const zonesDataStore = useZonesStore();

  // Get state and actions related to booking creation
  const bookingActions = useBookingActionsStore();

  // Get Supplier-specific actions
  const supplierActionsStore = useSupplierActionsStore();

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

    // State and actions from booking actions store (relevant for Supplier)
    selectedZonesForCreation: bookingActions.selectedZonesForCreation,
    // Supplier doesn't select supplier, it's implicit
    // selectedSupplierInnForCreation: bookingActions.selectedSupplierInnForCreation,
    isCreatingBooking: bookingActions.isCreating, // Renamed for clarity
    createBookingError: bookingActions.createError,
    setSelectedZonesForCreation: bookingActions.setSelectedZonesForCreation,
    addSelectedZoneForCreation: bookingActions.addSelectedZoneForCreation,
    removeSelectedZoneForCreation: bookingActions.removeSelectedZoneForCreation,
    clearSelectedZonesForCreation: bookingActions.clearSelectedZonesForCreation,
    // setSelectedSupplierInnForCreation: bookingActions.setSelectedSupplierInnForCreation, // Not needed for supplier
    // Wrap createBookingRequest to inject the user object
    // Supplier might not need to pass supplierId explicitly if API derives it from session
    createBookingRequest: async () => {
        if (!userForBooking) {
            console.error("User not available for booking creation.");
            createErrorToast(toast)('Ошибка', 'Пользователь не авторизован.');
            return false;
        }
        // Supplier INN might be set automatically by API based on user session
        // Or if needed, set it here before calling:
        // bookingActions.setSelectedSupplierInnForCreation(userForBooking.inn); // Assuming INN is on user
        return bookingActions.createBookingRequest(userForBooking);
    },

    // Wrapped Supplier-specific actions
    refreshZones: () => supplierActionsStore.refreshZones(toast),

    // Other relevant data (if any)
    // userInn: session?.user?.inn, // Example
  };
};
