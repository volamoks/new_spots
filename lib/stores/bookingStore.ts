import { create } from 'zustand';
import { useToast } from '@/components/ui/use-toast';
import { BookingRequest, type Booking, User, Zone, BookingStatus, Role } from '@prisma/client';

// Add this type definition
export type BookingRequestWithBookings = BookingRequest & {
    bookings: (Booking & { zone: Zone; bookingRequest: BookingRequest })[];
    supplier: User | null;
    user: User;
};

// Define a SimplifiedUser type
interface SimplifiedUser {
    id: string;
    role: Role;
    category?: string | null;
}

// Define a type for filters
export interface BookingFilters {
    status: string[];
    supplierName?: string;
    dateFrom?: string;
    dateTo?: string;
    [key: string]: string | string[] | undefined; // Allow for additional filter properties with specific types
}

interface BookingState {
    isLoading: boolean;
    error: string | null;
    setError: (error: string | null) => void;
    selectedZones: string[];
    setSelectedZones: (zones: string[]) => void;
    addSelectedZone: (zone: string) => void;
    removeSelectedZone: (zone: string) => void;
    clearSelectedZones: () => void;
    selectedSupplierInn: string | null;
    setSelectedSupplierInn: (inn: string | null) => void;
    createBooking: (zoneIds: string[], user: SimplifiedUser | null, selectedSupplierInn: string | null) => Promise<void>;
    filteredBookings: BookingRequestWithBookings[]; // Use the custom type
    setFilteredBookings: (bookings: BookingRequestWithBookings[]) => void; // Update the setter too
    fetchBookings: (status?: string) => Promise<void>;
    approveBooking: (bookingId: string, role: string) => Promise<void>;
    rejectBooking: (bookingRequestId: string, zoneId: string, bookingId: string) => Promise<void>;
    dmpApproveBooking: (bookingRequestId: string, zoneId: string) => Promise<void>;
    dmpRejectBooking: (bookingRequestId: string, zoneId: string) => Promise<void>;
    updateRequestStatus: (requestId: string) => Promise<void>;
    applyFilters: (filters: BookingFilters) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    isLoading: false,
    error: null,
    setError: (error: string | null) => set({ error }),
    selectedZones: [],
    setSelectedZones: (zones: string[]) => set({ selectedZones: zones }),
    addSelectedZone: (zone: string) =>
        set((state) => ({ selectedZones: [...state.selectedZones, zone] })),
    removeSelectedZone: (zone: string) =>
        set((state) => ({
            selectedZones: state.selectedZones.filter((id) => id !== zone),
        })),
    clearSelectedZones: () => set({ selectedZones: [] }),
    selectedSupplierInn: null,
    setSelectedSupplierInn: (inn: string | null) => set({ selectedSupplierInn: inn }),
    filteredBookings: [],
    setFilteredBookings: (bookings: BookingRequestWithBookings[]) =>
        set({ filteredBookings: bookings as BookingRequestWithBookings[] }),

    createBooking: async (zoneIds, user, selectedSupplierInn) => {
        set({ isLoading: true, error: null });
        try {
            if (!user) {
                throw new Error('User not authenticated');
            }
            // Prepare data for the API request
            const requestData = {
                zoneIds: zoneIds,
                supplierId: selectedSupplierInn,
                userId: user?.id,
            };

            // Make the API call
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                // Handle error responses from the API
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create booking');
            }

            // Handle success
            const result = await response.json();
            console.log('Booking created:', result);
            set({ isLoading: false });
            // Optionally, refresh bookings or update local state
        } catch (error: unknown) {
            set({
                error: error instanceof Error ? error.message : 'An unknown error occurred',
                isLoading: false,
            });
        }
    },
    fetchBookings: async (status?: string) => {
        set({ isLoading: true, error: null });
        try {
            // Use the API route instead of direct database access
            const url = status ? `/api/bookings?status=${status}` : '/api/bookings';
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch bookings');
            }
            
            const bookings = await response.json();
            console.log('Bookings from API:', bookings); // Debug log
            
            set({ filteredBookings: bookings as BookingRequestWithBookings[], isLoading: false });
        } catch (error: unknown) {
            console.error('Error fetching bookings:', error);
            set({
                error: error instanceof Error ? error.message : 'An unknown error occurred',
                isLoading: false,
            });
        }
    },
    approveBooking: async (bookingId: string, role: string) => {
        set({ isLoading: true, error: null });
        try {
            // Use API route instead of direct database access
            const response = await fetch(`/api/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    },
                body: JSON.stringify({ 
                    status: "KM_APPROVED",
                    role 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to approve booking');
            }

            // Update the local state
            set((state: BookingState) => {
                const requestIndex = state.filteredBookings.findIndex(
                    (bookingReq) => bookingReq.bookings.some((b) => b.id === bookingId)
                );

                if (requestIndex === -1) {
                    // Booking request not found, return current state
                    return state;
                }

                const updatedBookings = [...state.filteredBookings]; // Create a copy
                const bookingReq = updatedBookings[requestIndex];

                const updatedInnerBookings = bookingReq.bookings.map((b) =>
                    b.id === bookingId ? { ...b, status: "KM_APPROVED" as BookingStatus } : b
                );

                updatedBookings[requestIndex] = {
                    ...bookingReq,
                    bookings: updatedInnerBookings,
                };

                return { filteredBookings: updatedBookings, isLoading: false };
            });
        } catch (error: unknown) {
            console.error('Error approving booking:', error);
            set({
                error:
                    error instanceof Error ? error.message : "An unknown error occurred",
                isLoading: false,
            });
        }
    },
    dmpApproveBooking: async (bookingRequestId: string, zoneId: string) => {
        set({ isLoading: true, error: null });
        try {
            console.log('dmpApproveBooking called with bookingRequestId:', bookingRequestId, 'zoneId:', zoneId);

            let bookingIdToApprove: string | undefined;

            // Find the bookingId
            const { filteredBookings } = useBookingStore.getState(); // Access the state directly

            filteredBookings.forEach(bookingRequest => {
                bookingRequest.bookings.forEach(booking => {
                    if (booking.bookingRequestId === bookingRequestId && booking.zoneId === zoneId) {
                        bookingIdToApprove = booking.id;
                    }
                });
            });

            if (!bookingIdToApprove) {
                console.error('Could not find bookingId for bookingRequestId:', bookingRequestId, 'and zoneId:', zoneId);
                return;
            }

            // Use API route instead of direct database access
            const response = await fetch(`/api/bookings/${bookingIdToApprove}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: "DMP_APPROVED",
                    role: "DMP_MANAGER"
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to approve booking');
            }
            
            // Then update the zone with the supplier
            const zoneResponse = await fetch(`/api/zones/${zoneId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'BOOKED' }),
            });

            if (!zoneResponse.ok) {
                throw new Error('Failed to update zone status');
            }

            // Update the local state
            set((state: BookingState) => {
                const requestIndex = state.filteredBookings.findIndex(
                    (bookingReq) => bookingReq.bookings.some((b) => b.id === bookingIdToApprove)
                );

                if (requestIndex === -1) {
                    // Booking request not found, log a warning and return current state
                    console.warn(`Booking request with bookingId ${bookingRequestId} not found in local state. Consider refreshing bookings.`);
                    return state;
                }

                const updatedBookings = [...state.filteredBookings]; // Create a copy
                const bookingReq = updatedBookings[requestIndex];

                const updatedInnerBookings = bookingReq.bookings.map((b) =>
                    b.id === bookingIdToApprove ? { ...b, status: "DMP_APPROVED" as BookingStatus } : b
                );

                updatedBookings[requestIndex] = {
                    ...bookingReq,
                    bookings: updatedInnerBookings,
                };

                return { filteredBookings: updatedBookings, isLoading: false };
            });
        } catch (error: unknown) {
            console.error('Error approving booking by DMP:', error);
            set({
                error:
                    error instanceof Error ? error.message : "An unknown error occurred",
                isLoading: false,
            });
        }
    },
    rejectBooking: async (bookingRequestId: string, zoneId: string, bookingId: string) => {
        set({ isLoading: true, error: null });
        try {
            // Use API route instead of direct database access
            const response = await fetch(`/api/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: "KM_REJECTED",
                    role: 'CATEGORY_MANAGER'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to reject booking');
            }

            set((state: BookingState) => {
                const requestIndex = state.filteredBookings.findIndex(
                    (bookingReq) => bookingReq.bookings.some((b) => b.id === bookingId)
                );

                if (requestIndex === -1) {
                    // Booking request not found, log a warning and return current state
                    console.warn(`Booking request with bookingId ${bookingRequestId} not found in local state. Consider refreshing bookings.`);
                    return state;
                }

                const updatedBookings = [...state.filteredBookings]; // Create a copy
                const bookingReqIndex = updatedBookings[requestIndex].bookings.findIndex((b) => b.id === bookingId);

                if (bookingReqIndex === -1) {
                    console.warn(`Booking with bookingId ${bookingId} not found in local state. Consider refreshing bookings.`);
                    return state;
                }

                // Create a copy of the booking request
                const updatedBookingRequest = { ...updatedBookings[requestIndex] };

                // Create a copy of the bookings array
                const updatedBookingsArray = [...updatedBookingRequest.bookings];

                // Update the status of the specific booking
                updatedBookingsArray[bookingReqIndex] = {
                    ...updatedBookingsArray[bookingReqIndex],
                    status: "KM_REJECTED" as BookingStatus,
                };

                // Update the bookings array in the booking request
                updatedBookingRequest.bookings = updatedBookingsArray;

                // Update the booking request in the filtered bookings array
                updatedBookings[requestIndex] = updatedBookingRequest;

                return { filteredBookings: updatedBookings, isLoading: false };
            });
        } catch (error: unknown) {
            console.error('Error rejecting booking:', error);
            set({
                error:
                    error instanceof Error ? error.message : "An unknown error occurred",
                isLoading: false,
            });
        }
    },
    dmpRejectBooking: async (bookingRequestId: string, zoneId: string) => {
        set({ isLoading: true, error: null });
        try {
            let bookingIdToReject: string | undefined;

            // Find the bookingId
            const { filteredBookings } = useBookingStore.getState(); // Access the state directly

            filteredBookings.forEach(bookingRequest => {
                bookingRequest.bookings.forEach(booking => {
                    if (booking.bookingRequestId === bookingRequestId && booking.zoneId === zoneId) {
                        bookingIdToReject = booking.id;
                    }
                });
            });

            if (!bookingIdToReject) {
                console.error('Could not find bookingId for bookingRequestId:', bookingRequestId, 'and zoneId:', zoneId);
                return;
            }

            // Use API route instead of direct database access
            const response = await fetch(`/api/bookings/${bookingIdToReject}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    status: "DMP_REJECTED",
                    role: "DMP_MANAGER" 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to reject booking');
            }

            // Update the local state
            set((state: BookingState) => {
                const requestIndex = state.filteredBookings.findIndex(
                    (bookingReq) => bookingReq.bookings.some((b) => b.id === bookingIdToReject)
                );

                if (requestIndex === -1) {
                    // Booking request not found, return current state
                    return state;
                }

                const updatedBookings = [...state.filteredBookings]; // Create a copy
                const bookingReq = updatedBookings[requestIndex];

                const updatedInnerBookings = bookingReq.bookings.map((b) =>
                    b.id === bookingIdToReject ? { ...b, status: "DMP_REJECTED" as BookingStatus } : b
                );

                updatedBookings[requestIndex] = {
                    ...bookingReq,
                    bookings: updatedInnerBookings,
                };
                return { filteredBookings: updatedBookings, isLoading: false };
            });
        } catch (error: unknown) {
            console.error('Error rejecting booking by DMP:', error);
            set({
                error:
                    error instanceof Error ? error.message : "An unknown error occurred",
                isLoading: false,
            });
        }
    },
    updateRequestStatus: async (requestId: string) => {
        set({ isLoading: true, error: null });
        try {
            // Use API route instead of direct database access
            const response = await fetch(`/api/requests/${requestId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'PROCESSED' }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update request status');
            }

            set({ isLoading: false });
        } catch (error: unknown) {
            console.error('Error updating request status:', error);
            set({
                error:
                    error instanceof Error ? error.message : "An unknown error occurred",
                isLoading: false,
            });
        }
    },
    applyFilters: (filters: BookingFilters) => {
        // This function would apply filters to the filteredBookings
        // For now, it's a placeholder
        console.log('Applying filters:', filters);
    },
}));

export const useBookingToasts = () => {
    const { toast } = useToast();

    const showSuccessToast = (title: string, description: string) => {
        toast({
            title: title,
            description: description,
            variant: "default",
        });
    };

    const showErrorToast = (title: string, description: string) => {
        toast({
            title: title,
            description: description,
            variant: "destructive",
        });
    };

    return { showSuccessToast, showErrorToast };
};
