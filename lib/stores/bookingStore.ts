import { create } from 'zustand';
import { useToast } from '@/components/ui/use-toast';
import { BookingRequest, type Booking, User, Zone, BookingStatus, Role } from '@prisma/client';
import BookingRole from '@/lib/enums/BookingRole';

// Add this type definition
export type BookingRequestWithBookings = BookingRequest & {
    bookings: (Booking & { zone: Zone; bookingRequest: BookingRequest })[];
    supplier: User | null;
    user: User;
    supplierName: string;
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
    supplierInn?: string; // Added for filtering by supplier INN
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
    updateBookingStatus: (bookingId: string | undefined, bookingRequestId: string | undefined, zoneId: string | undefined, status: BookingStatus, role: BookingRole) => Promise<void>;
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

    createBooking: async (zoneIds: string[], user: SimplifiedUser | null, selectedSupplierInn: string | null) => {
        set({ isLoading: true, error: null });
        try {
            if (!user) {
                throw new Error('User not authenticated');
            }
            // Prepare data for the API request
            const requestData = {
                zoneIds: zoneIds,
                supplierId: selectedSupplierInn, // Use the selected supplier's INN
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
    updateBookingStatus: async (bookingId, bookingRequestId, zoneId, status, role) => {
        set({ isLoading: true, error: null });
        try {
            let idToUpdate = bookingId;

            // If bookingId is not provided, but bookingRequestId and zoneId are, find the bookingId
            if (!bookingId && bookingRequestId && zoneId) {
                const { filteredBookings } = useBookingStore.getState();
                filteredBookings.forEach(bookingRequest => {
                    bookingRequest.bookings.forEach(booking => {
                        if (booking.bookingRequestId === bookingRequestId && booking.zoneId === zoneId) {
                            idToUpdate = booking.id;
                        }
                    });
                });
                if (!idToUpdate) {
                    console.error('Could not find bookingId for bookingRequestId:', bookingRequestId, 'and zoneId:', zoneId);
                    return;
                }
            }

            if (!idToUpdate) {
                console.error('No bookingId or bookingRequestId/zoneId provided');
                return
            }


            // Use API route instead of direct database access
            const response = await fetch(`/api/bookings/${idToUpdate}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status,
                    role,
                }),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    throw new Error('Failed to parse error response');
                }
                throw new Error(errorData.error || 'Failed to update booking status');
            }

            // Update the local state
            set((state: BookingState) => {
                const requestIndex = state.filteredBookings.findIndex(
                    (bookingReq) => bookingReq.bookings.some((b) => b.id === idToUpdate)
                );

                if (requestIndex === -1) {
                    // Booking request not found, log a warning and return current state
                    console.warn(`Booking request with bookingId ${idToUpdate} not found in local state. Consider refreshing bookings.`);
                    return state;
                }

                const updatedBookings = [...state.filteredBookings];
                const bookingReq = updatedBookings[requestIndex];
                const updatedInnerBookings = bookingReq.bookings.map((b) =>
                    b.id === idToUpdate ? { ...b, status: status as BookingStatus } : b
                );

                updatedBookings[requestIndex] = {
                    ...bookingReq,
                    bookings: updatedInnerBookings,
                };

                return { ...state, filteredBookings: updatedBookings, isLoading: false };
            });
        } catch (error: unknown) {
            console.error('Error updating booking status:', error);
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
        set((state) => {
            // Get all bookings from the API response
            const { filteredBookings: allBookings } = state;

            // Apply filters
            let filtered = [...allBookings];

            // Filter by status
            if (filters.status && filters.status.length > 0) {
                filtered = filtered.filter(booking => {
                    // Check if any booking in the request has the selected status
                    return booking.bookings.some(b => filters.status.includes(b.status));
                });
            }

            // Filter by supplier name
            if (filters.supplierName && filters.supplierName.trim() !== '') {
                filtered = filtered.filter(booking => {
                    return booking.supplierName.toLowerCase().includes(filters.supplierName!.toLowerCase());
                });
            }
            // Filter by date range (using createdAt as a proxy for booking date)
            if (filters.dateFrom) {
                const fromDate = new Date(filters.dateFrom);
                filtered = filtered.filter(booking => {
                    // Check if any booking in the request was created after dateFrom
                    return booking.bookings.some(b => {
                        const bookingDate = new Date(b.createdAt);
                        return bookingDate >= fromDate;
                    });
                });
            }

            if (filters.dateTo) {
                const toDate = new Date(filters.dateTo);
                filtered = filtered.filter(booking => {
                    // Check if any booking in the request was created before dateTo
                    return booking.bookings.some(b => {
                        const bookingDate = new Date(b.createdAt);
                        return bookingDate <= toDate;
                    });
                });
            }

            // Filter by supplier ID (for supplier role - only show their own bookings)
            if (filters.supplierInn) {
                filtered = filtered.filter(booking => {
                    return booking.supplier?.inn === filters.supplierInn;
                });
            }

            console.log('Applied filters:', filters);
            console.log('Filtered bookings count:', filtered.length);

            return { filteredBookings: filtered };
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
