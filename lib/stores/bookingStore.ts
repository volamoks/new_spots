import { create } from 'zustand';
import { getAllBookings, updateBookingStatus } from '@/lib/services/bookingService';
import { useToast } from '@/components/ui/use-toast';
import { type RequestFilterState } from '@/app/components/RequestFilters';
import { BookingRequest, type Booking, User, Zone, BookingStatus, Role } from '@prisma/client';

// Add this type definition
type BookingRequestWithBookings = BookingRequest & {
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
    rejectBooking: (bookingId: string, role: string) => Promise<void>;
    updateRequestStatus: (requestId: string) => Promise<void>;
    applyFilters: (filters: RequestFilterState) => void;
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
            const bookings = await getAllBookings(status);
            // console.log(bookings); // Inspect the bookings data
            set({ filteredBookings: bookings as BookingRequestWithBookings[], isLoading: false });
        } catch (error: unknown) {
            set({
                error: error instanceof Error ? error.message : 'An unknown error occurred',
                isLoading: false,
            });
        }
    },
    approveBooking: async (bookingId: string, role: string) => {
        set({ isLoading: true, error: null });
        try {
            await updateBookingStatus(bookingId, "KM_APPROVED", role);
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
            set({
                error:
                    error instanceof Error ? error.message : "An unknown error occurred",
                isLoading: false,
            });
        }
    },
    rejectBooking: async (bookingId: string, role: string) => {
        set({ isLoading: true, error: null });
        try {
            await updateBookingStatus(bookingId, "KM_REJECTED", role);
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
                    b.id === bookingId ? { ...b, status: "KM_REJECTED" as BookingStatus } : b
                );

                updatedBookings[requestIndex] = {
                    ...bookingReq,
                    bookings: updatedInnerBookings,
                };
                return { filteredBookings: updatedBookings, isLoading: false };
            });
        } catch (error: unknown) {
            set({
                error:
                    error instanceof Error ? error.message : "An unknown error occurred",
                isLoading: false,
            });
        }
    },
    updateRequestStatus: async () => {
        set({ isLoading: true, error: null });
        try {
            // updateBookingStatus is designed to work with individual booking IDs, not request IDs
            // This function needs to be rethought if we want to update the entire request status
            // For now, it will do nothing
            set({ isLoading: false });
        } catch (error: unknown) {
            set({
                error:
                    error instanceof Error ? error.message : "An unknown error occurred",
                isLoading: false,
            });
        }
    },
    applyFilters: (filters: RequestFilterState) => {
        set((state) => {
            const filteredBookings = state.filteredBookings.map((bookingRequest) => {
                const filteredBookings =
                    filters.status.length > 0
                        ? bookingRequest.bookings.filter((booking: Booking) =>
                            filters.status.includes(booking.status)
                        )
                        : bookingRequest.bookings;

                return { ...bookingRequest, bookings: filteredBookings };
            });

            return { ...state, filteredBookings };
        });
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
