import { create } from "zustand";
import { createBookingRequest, getAllBookings, updateBookingStatus } from "@/lib/services/bookingService";
import { useToast } from "@/components/ui/use-toast";
import { type RequestFilterState } from "@/app/components/RequestFilters";
import { BookingRequest, type Booking } from "@prisma/client";

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
  createBooking: (zoneIds: string[]) => Promise<void>;
  filteredBookings: BookingRequest[];
  setFilteredBookings: (bookings: BookingRequest[]) => void;
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
  setFilteredBookings: (bookings: BookingRequest[]) =>
    set({ filteredBookings: bookings }),

  createBooking: async (zoneIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const userId = "user123";
      const userRole = "SUPPLIER";

      const result = await createBookingRequest(userId, zoneIds, userRole);
      console.log(result);
      set({ isLoading: false });
    } catch (error: unknown) {
      set({
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
        isLoading: false,
      });
    }
  },
  fetchBookings: async (status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const bookings = await getAllBookings(status);
      set({ filteredBookings: bookings, isLoading: false });
    } catch (error: unknown) {
      set({
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
        isLoading: false,
      });
    }
  },
  approveBooking: async (bookingId: string, role: string) => {
    set({ isLoading: true, error: null });
    try {
      await updateBookingStatus(bookingId, "KM_APPROVED", role);
      set((state) => {
        const updatedBookings = state.filteredBookings.map(
          (bookingReq: BookingRequest) => {
            if (bookingReq.bookings.some((b: Booking) => b.id === bookingId)) {
              const updatedBookings = bookingReq.bookings.map((b: Booking) =>
                b.id === bookingId ? { ...b, status: "KM_APPROVED" } : b
              );
              return { ...bookingReq, bookings: updatedBookings };
            }
            return bookingReq;
          }
        );
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

      set((state) => {
        const updatedBookings = state.filteredBookings.map(
          (bookingReq: BookingRequest) => {
            if (bookingReq.bookings.some((b: Booking) => b.id === bookingId)) {
              const updatedBookings = bookingReq.bookings.map((b: Booking) =>
                b.id === bookingId ? { ...b, status: "KM_REJECTED" } : b
              );
              return { ...bookingReq, bookings: updatedBookings };
            }
            return bookingReq;
          }
        );
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
