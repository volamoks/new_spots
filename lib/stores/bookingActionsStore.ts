import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { BookingStatus, Role } from '@prisma/client'; // Remove Role import
import BookingRole from '@/lib/enums/BookingRole'; // Import the custom enum
import { useLoaderStore } from './loaderStore'; // Use the global loader
import { useBookingRequestStore } from './bookingRequestStore'; // To trigger refresh/update
import { toast } from '@/components/ui/use-toast'; // Import toast function

// --- Types ---

// Define a SimplifiedUser type if needed for context, or get from session/auth hook
export interface SimplifiedUser { // Added export
    id: string;
    role: Role;
    // Add other relevant fields like category if needed
}

interface BookingActionsState {
    // State for Creation Process
    selectedZonesForCreation: Set<string>; // Use Set for efficiency
    selectedSupplierInnForCreation: string | null;
    isCreating: boolean; // Specific loading state for creation
    createError: string | null;

    // State for Update Processes (can use global loader or specific states)
    isUpdatingStatus: boolean;
    updateStatusError: string | null;

    // Actions
    setSelectedZonesForCreation: (zoneIds: string[]) => void;
    addSelectedZoneForCreation: (zoneId: string) => void;
    removeSelectedZoneForCreation: (zoneId: string) => void;
    clearSelectedZonesForCreation: () => void;
    setSelectedSupplierInnForCreation: (inn: string | null) => void;

    createBookingRequest: (user: SimplifiedUser) => Promise<boolean>; // Returns true on success
    updateBookingStatus: (bookingId: string, status: BookingStatus, role: BookingRole) => Promise<boolean>; // Use custom BookingRole enum
    updateRequestStatus: (requestId: string, status: string) => Promise<boolean>; // Returns true on success
}

// --- Store Definition ---

export const useBookingActionsStore = create<BookingActionsState>()(
    devtools(
        (set, get) => ({
            // Initial State
            selectedZonesForCreation: new Set(),
            selectedSupplierInnForCreation: null,
            isCreating: false,
            createError: null,
            isUpdatingStatus: false,
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

            createBookingRequest: async (user) => {
                const { selectedZonesForCreation, selectedSupplierInnForCreation } = get();
                const { withLoading } = useLoaderStore.getState();
                const refreshBookingRequests = useBookingRequestStore.getState().fetchBookingRequests;
                // Potentially refresh zones if their status changes after booking
                // const refreshZones = useZonesStore.getState().fetchZones; // Removed unused variable

                if (selectedZonesForCreation.size === 0) {
                    set({ createError: 'Please select at least one zone.' });
                    return false;
                }
                // Supplier INN might be optional depending on the role creating the booking
                // Add validation if required for the specific user role
                // if (!selectedSupplierInnForCreation && user.role !== 'SOME_ROLE_THAT_DOESNT_NEED_SUPPLIER') {
                //     set({ createError: 'Please select a supplier.' });
                //     return false;
                // }

                set({ isCreating: true, createError: null });

                try {
                    const zoneIds = Array.from(selectedZonesForCreation);
                    const requestData = {
                        zoneIds: zoneIds,
                        supplierId: selectedSupplierInnForCreation, // API should handle null if appropriate
                        userId: user.id, // Assuming user object is passed in
                    };

                    await withLoading(
                        fetch('/api/bookings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(requestData),
                        }).then(async response => {
                            if (!response.ok) {
                                const errorData = await response.json().catch(() => ({ error: 'Failed to create booking request' }));
                                throw new Error(errorData.error || 'Failed to create booking request');
                            }
                            return response.json();
                        }),
                        'Creating booking request...'
                    );

                    set({ isCreating: false, selectedZonesForCreation: new Set(), selectedSupplierInnForCreation: null }); // Clear selection on success
                    await refreshBookingRequests(); // Refresh the list
                    // await refreshZones(); // Uncomment if zone status might change
                    toast({ // Add success toast
                        title: 'Успех',
                        description: 'Заявка на бронирование успешно создана.',
                        variant: 'success', // Optional: Add success variant if defined
                    });
                    return true; // Indicate success

                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error creating booking request";
                    console.error("Error creating booking request:", errorMessage);
                    set({ createError: errorMessage, isCreating: false });
                    toast({ // Add error toast
                        title: 'Ошибка',
                        description: errorMessage,
                        variant: 'destructive',
                    });
                    return false; // Indicate failure
                }
            },

            updateBookingStatus: async (bookingId, status, role) => {
                const { withLoading } = useLoaderStore.getState();
                const updateLocalStatus = useBookingRequestStore.getState().updateBookingStatusLocally;
                // const refreshBookingRequests = useBookingRequestStore.getState().fetchBookingRequests; // Removed unused variable

                set({ isUpdatingStatus: true, updateStatusError: null }); // Or use global loader via withLoading

                try {
                    await withLoading(
                        fetch(`/api/bookings/${bookingId}`, { // Assuming PATCH endpoint exists
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status, role: role.toString() }), // Pass role if needed by API
                        }).then(async response => {
                            if (!response.ok) {
                                const errorData = await response.json().catch(() => ({ error: 'Failed to update booking status' }));
                                throw new Error(errorData.error || 'Failed to update booking status');
                            }
                            return response.json();
                        }),
                        'Updating booking status...'
                    );

                    set({ isUpdatingStatus: false });
                    // Optimistic update or full refresh:
                    updateLocalStatus(bookingId, status);
                    // OR await refreshBookingRequests();
                    return true; // Indicate success

                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error updating booking status";
                    console.error("Error updating booking status:", errorMessage);
                    set({ updateStatusError: errorMessage, isUpdatingStatus: false });
                    // Consider reverting optimistic update here if implemented
                    return false; // Indicate failure
                }
            },

            updateRequestStatus: async (requestId, status) => {
                const { withLoading } = useLoaderStore.getState();
                // const updateLocalRequest = useBookingRequestStore.getState().updateBookingRequestLocally; // Removed unused variable
                const refreshBookingRequests = useBookingRequestStore.getState().fetchBookingRequests;

                // Consider using a specific loading state or rely on global loader
                try {
                    await withLoading(
                        fetch(`/api/requests/${requestId}`, { // Assuming PATCH endpoint exists
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status }),
                        }).then(async response => {
                            if (!response.ok) {
                                const errorData = await response.json().catch(() => ({ error: 'Failed to update request status' }));
                                throw new Error(errorData.error || 'Failed to update request status');
                            }
                            return response.json();
                        }),
                        'Updating request status...'
                    );

                    // Optimistic update or full refresh:
                    // Need to know what fields change on the request object
                    // updateLocalRequest(requestId, { status: status }); // Example if only status changes
                    await refreshBookingRequests(); // Safer to refresh the whole list
                    return true; // Indicate success

                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error updating request status";
                    console.error("Error updating request status:", errorMessage);
                    // Set specific error state if needed
                    return false; // Indicate failure
                }
            },

        }),
        { name: 'bookingActionsStore' }
    )
);