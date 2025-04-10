import { create } from 'zustand';
import { devtools } from 'zustand/middleware'; // Remove persist imports
import { BookingStatus, Role } from '@prisma/client'; // Remove Role import
import BookingRole from '@/lib/enums/BookingRole'; // Import the custom enum
// Remove useLoaderStore import
// import { useLoaderStore } from './loaderStore';
import { useBookingRequestStore } from './bookingRequestStore'; // To trigger refresh/update
import { toast } from '@/components/ui/use-toast'; // Import toast function
import { useZonesStore } from './zonesStore'; // Import zones store
// Import the new utility and ApiError
import { fetchWithLoading, ApiError } from '@/lib/utils/api'; // Adjust path if necessary

// --- Types ---

// Define a SimplifiedUser type if needed for context, or get from session/auth hook
export interface SimplifiedUser { // Added export
    id: string;
    role: Role;
    // Add other relevant fields like category if needed
}

export interface BookingActionsState { // Export the interface
    // State for Creation Process (loading handled globally)
    selectedZonesForCreation: Set<string>; // Use Set for efficiency
    selectedSupplierInnForCreation: string | null;
    selectedBrandId: string | null; // Add state for selected brand ID
    selectedCategoryForCreation: string | null; // Add state for selected category
    // isCreating: boolean; // Removed, use global loader
    createError: string | null;

    // State for Update Processes (loading handled globally)
    // isUpdatingStatus: boolean; // Removed, use global loader
    updateStatusError: string | null;

    // Actions
    setSelectedZonesForCreation: (zoneIds: string[]) => void;
    addSelectedZoneForCreation: (zoneId: string) => void;
    removeSelectedZoneForCreation: (zoneId: string) => void;
    clearSelectedZonesForCreation: () => void;
    setSelectedSupplierInnForCreation: (inn: string | null) => void;
    setSelectedBrandId: (brandId: string | null) => void; // Add action for brand ID
    setSelectedCategoryForCreation: (category: string | null) => void; // Add action for category

    createBookingRequest: (user: SimplifiedUser) => Promise<boolean>; // Returns true on success
    updateBookingStatus: (bookingId: string, status: BookingStatus, role: BookingRole) => Promise<boolean>; // Use custom BookingRole enum
    updateRequestStatus: (requestId: string, status: string) => Promise<boolean>; // Returns true on success
}

// --- Store Definition ---

export const useBookingActionsStore = create<BookingActionsState>()(
    devtools( // Remove persist wrapper
        (set, get) => ({
            // Initial State
            selectedZonesForCreation: new Set(),
            selectedSupplierInnForCreation: null,
            selectedBrandId: null, // Initialize brand ID state
            selectedCategoryForCreation: null, // Initialize category state
            // isCreating: false, // Removed
            createError: null,
            // isUpdatingStatus: false, // Removed
            updateStatusError: null,

            // --- Actions ---

            setSelectedZonesForCreation: (zoneIds) => {
                set({ selectedZonesForCreation: new Set(zoneIds) });
            },
            addSelectedZoneForCreation: (zoneId) => {
                set((state) => {
                    const newSelection = new Set(state.selectedZonesForCreation);
                    newSelection.add(zoneId);
                    return { selectedZonesForCreation: newSelection };
                });
            },
            removeSelectedZoneForCreation: (zoneId) => {
                set((state) => {
                    const newSelection = new Set(state.selectedZonesForCreation);
                    newSelection.delete(zoneId);
                    return { selectedZonesForCreation: newSelection };
                });
            },
            clearSelectedZonesForCreation: () => {
                set({ selectedZonesForCreation: new Set() });
            },
            setSelectedSupplierInnForCreation: (inn) => {
                set({ selectedSupplierInnForCreation: inn });
            },
            setSelectedBrandId: (brandId) => {
                set({ selectedBrandId: brandId });
            },
            setSelectedCategoryForCreation: (category) => {
                set({ selectedCategoryForCreation: category });
            },

            createBookingRequest: async (user) => {
                const { selectedZonesForCreation, selectedSupplierInnForCreation, selectedBrandId, selectedCategoryForCreation } = get(); // Get category
                // Remove direct loader import: const { withLoading } = useLoaderStore.getState();
                const refreshBookingRequests = useBookingRequestStore.getState().fetchBookingRequests;
                const refreshZones = useZonesStore.getState().fetchZones;

                if (selectedZonesForCreation.size === 0) {
                    set({ createError: 'Please select at least one zone.' });
                    return false;
                }

                set({ createError: null }); // Reset error before attempt

                try {
                    const zoneIds = Array.from(selectedZonesForCreation);
                    const requestData = {
                        zoneIds: zoneIds,
                        supplierId: selectedSupplierInnForCreation,
                        userId: user.id,
                        brandId: selectedBrandId,
                        category: selectedCategoryForCreation, // Add category to request data
                    };
                    console.log('[Store Action] Creating booking with requestData:', requestData);

                    // Use fetchWithLoading
                    await fetchWithLoading(
                        '/api/bookings',
                        'POST',
                        'Creating booking request...',
                        requestData
                    );

                    set({ selectedZonesForCreation: new Set(), selectedSupplierInnForCreation: null, selectedBrandId: null, selectedCategoryForCreation: null }); // Reset category
                    await refreshBookingRequests();
                    await refreshZones();
                    toast({
                        title: 'Успешно',
                        description: 'Заявка на бронирование успешно создана.',
                        variant: 'success',
                    });
                    return true;

                } catch (error) {
                    const errorMessage = error instanceof ApiError || error instanceof Error ? error.message : "Unknown error creating booking request";
                    console.error("Error creating booking request:", errorMessage);
                    set({ createError: errorMessage });
                    toast({
                        title: 'Ошибка',
                        description: errorMessage,
                        variant: 'destructive',
                    });
                    return false;
                }
            },

            updateBookingStatus: async (bookingId, status, role) => {
                // Remove direct loader import: const { withLoading } = useLoaderStore.getState();
                const updateLocalStatus = useBookingRequestStore.getState().updateBookingStatusLocally;

                set({ updateStatusError: null }); // Reset error before attempt

                try {
                    // Use fetchWithLoading
                    await fetchWithLoading(
                        `/api/bookings/${bookingId}`,
                        'PATCH',
                        'Updating booking status...',
                        { status, role: role.toString() } // Pass role if needed by API
                    );

                    // Optimistic update or full refresh:
                    updateLocalStatus(bookingId, status);
                    // OR await refreshBookingRequests();
                    return true;

                } catch (error) {
                    const errorMessage = error instanceof ApiError || error instanceof Error ? error.message : "Unknown error updating booking status";
                    console.error("Error updating booking status:", errorMessage);
                    set({ updateStatusError: errorMessage });
                    // Consider reverting optimistic update here if implemented
                    return false;
                }
            },

            updateRequestStatus: async (requestId, status) => {
                // Remove direct loader import: const { withLoading } = useLoaderStore.getState();
                const refreshBookingRequests = useBookingRequestStore.getState().fetchBookingRequests;

                try {
                    // Use fetchWithLoading
                    await fetchWithLoading(
                        `/api/requests/${requestId}`,
                        'PATCH',
                        'Updating request status...',
                        { status }
                    );

                    // Optimistic update or full refresh:
                    // Need to know what fields change on the request object
                    // updateLocalRequest(requestId, { status: status }); // Example if only status changes
                    await refreshBookingRequests(); // Safer to refresh the whole list
                    return true;

                } catch (error) {
                    const errorMessage = error instanceof ApiError || error instanceof Error ? error.message : "Unknown error updating request status";
                    console.error("Error updating request status:", errorMessage);
                    // Set specific error state if needed
                    // Consider adding toast notification for error
                    return false;
                }
            },

        }),
        { name: 'bookingActionsStore' } // Revert name if changed
    ) // Close devtools
); // Close create