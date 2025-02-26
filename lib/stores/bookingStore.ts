import { create } from 'zustand';
import { getBookings } from '../api/bookings';
import { format } from 'date-fns';
import { useToast as useToastHook } from '@/components/ui/use-toast';
import { useCallback } from 'react';
import {
  BookingRequestWithBookings,
  BookingUI,
  BookingFromApi,
  RequestFilterState
} from '@/types/booking';

interface BookingStore {
  // Состояние
  bookings: BookingUI[];
  filteredBookings: BookingUI[];
  isLoading: boolean;
  error: string | null;
  filters: RequestFilterState;

  // Действия
  fetchBookings: (status?: string) => Promise<void>;
  approveBooking: (bookingId: string, role: 'CATEGORY_MANAGER' | 'DMP_MANAGER') => Promise<void>;
  rejectBooking: (bookingId: string, role: 'CATEGORY_MANAGER' | 'DMP_MANAGER') => Promise<void>;
  updateRequestStatus: (requestId: string, newStatus: string) => Promise<void>;
  applyFilters: (filters: RequestFilterState) => void;
  resetFilters: () => void;
}

// Создаем хранилище
export const useBookingStore = create<BookingStore>((set, get) => ({
  // Начальное состояние
  bookings: [],
  filteredBookings: [],
  isLoading: false,
  error: null,
  filters: {
    status: "",
    supplierName: "",
    dateFrom: "",
    dateTo: "",
  },

  // Действия
  fetchBookings: async (status?: string) => {
    try {
      set({ isLoading: true, error: null });

      // Construct the URL with the status parameter
      let url = '/api/bookings';
      if (status) {
        url += `?status=${status}`;
      }

      // Получаем данные
      const bookingsData = await getBookings(url);
      // console.log("Bookings data:", bookingsData);

      if (!bookingsData) {
        set({ error: "Не удалось получить данные о бронированиях", isLoading: false });
        return;
      }

      // Трансформируем данные
      const transformedBookings: BookingUI[] = [];

      // Обрабатываем данные как массив запросов
      if (Array.isArray(bookingsData)) {
        bookingsData.forEach((request: BookingRequestWithBookings) => {
          if (request.bookings && Array.isArray(request.bookings)) {
            request.bookings.forEach((booking: BookingFromApi) => {
              transformedBookings.push({
                id: booking.id,
                bookingRequestId: booking.bookingRequestId,
                zoneId: booking.zoneId,
                status: booking.status,
                createdAt: new Date(booking.createdAt),
                updatedAt: new Date(booking.updatedAt),
                zone: {
                  id: booking.zone?.id || '',
                  city: booking.zone?.city || '',
                  number: booking.zone?.number || '',
                  market: booking.zone?.market || '',
                  newFormat: booking.zone?.newFormat || '',
                  equipment: booking.zone?.equipment || '',
                  dimensions: booking.zone?.dimensions || '',
                  mainMacrozone: booking.zone?.mainMacrozone || '',
                  adjacentMacrozone: booking.zone?.adjacentMacrozone || '',
                },
                bookingRequest: {
                  userId: request.userId || '',
                  status: request.status,
                  category: request.category ?? null,
                  createdAt: request.createdAt ? format(new Date(request.createdAt), 'yyyy-MM-dd') : '',
                  user: {
                    name: request.user?.name || 'Неизвестный пользователь',
                  },
                },
              });
            });
          }
        });
      }
      // Обрабатываем данные как один запрос с массивом бронирований
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      else if (bookingsData && typeof bookingsData === 'object' && 'bookings' in bookingsData && Array.isArray((bookingsData as any).bookings)) {
        // Безопасно приводим тип к BookingRequestWithBookings
        const request = bookingsData as BookingRequestWithBookings;
        request.bookings?.forEach((booking: BookingFromApi) => {
          transformedBookings.push({
            id: booking.id,
            bookingRequestId: booking.bookingRequestId,
            zoneId: booking.zoneId,
            status: booking.status,
            createdAt: new Date(booking.createdAt),
            updatedAt: new Date(booking.updatedAt),
            zone: {
              id: booking.zone?.id || '',
              city: booking.zone?.city || '',
              number: booking.zone?.number || '',
              market: booking.zone?.market || '',
              newFormat: booking.zone?.newFormat || '',
              equipment: booking.zone?.equipment || '',
              dimensions: booking.zone?.dimensions || '',
              mainMacrozone: booking.zone?.mainMacrozone || '',
              adjacentMacrozone: booking.zone?.adjacentMacrozone || '',
            },
            bookingRequest: {
              userId: request.userId || '',
              status: request.status,
              category: request.category ?? null,
              createdAt: request.createdAt ? format(new Date(request.createdAt), 'yyyy-MM-dd') : '',
              user: {
                name: request.user?.name || 'Неизвестный пользователь',
              },
            },
          });
        });
      }

      // Применяем фильтры к новым данным
      const filters = get().filters;
      let filtered = transformedBookings;

      if (filters.status) {
        filtered = filtered.filter((booking) => booking.bookingRequest.status === filters.status);
      }

      // Обновляем состояние
      set({
        bookings: transformedBookings,
        filteredBookings: filtered,
        isLoading: false
      });
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      set({
        error: error instanceof Error ? error.message : "Неизвестная ошибка при загрузке данных",
        isLoading: false
      });
    }
  },

  approveBooking: async (bookingId: string, role: 'CATEGORY_MANAGER' | 'DMP_MANAGER') => {
    try {
      const action = role === 'CATEGORY_MANAGER' ? 'approve-km' : 'approve-dmp';

      // Находим запись в хранилище по ID бронирования
      const booking = get().bookings.find(b => b.id === bookingId);

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Используем ID запроса для URL, а ID бронирования передаем в теле запроса
      const response = await fetch(`/api/bookings/${booking.bookingRequestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, bookingId }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve booking");
      }

      const updatedBooking = await response.json();

      // Обновляем состояние
      set(state => ({
        bookings: state.bookings.map(booking =>
          booking.id === updatedBooking.id ? updatedBooking : booking
        ),
        filteredBookings: state.filteredBookings.map(booking =>
          booking.id === updatedBooking.id ? updatedBooking : booking
        )
      }));
    } catch (error) {
      console.error("Error approving booking:", error);
      set({
        error: error instanceof Error ? error.message : "Неизвестная ошибка при одобрении бронирования"
      });
    }
  },

  rejectBooking: async (bookingId: string, role: 'CATEGORY_MANAGER' | 'DMP_MANAGER') => {
    try {
      const action = role === 'CATEGORY_MANAGER' ? 'reject-km' : 'reject-dmp';

      // Находим запись в хранилище по ID бронирования
      const booking = get().bookings.find(b => b.id === bookingId);

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Используем ID запроса для URL, а ID бронирования передаем в теле запроса
      const response = await fetch(`/api/bookings/${booking.bookingRequestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, bookingId }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject booking");
      }

      const updatedBooking = await response.json();

      // Обновляем состояние
      set(state => ({
        bookings: state.bookings.map(booking =>
          booking.id === updatedBooking.id ? updatedBooking : booking
        ),
        filteredBookings: state.filteredBookings.map(booking =>
          booking.id === updatedBooking.id ? updatedBooking : booking
        )
      }));
    } catch (error) {
      console.error("Error rejecting booking:", error);
      set({
        error: error instanceof Error ? error.message : "Неизвестная ошибка при отклонении бронирования"
      });
    }
  },

  updateRequestStatus: async (requestId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Оптимистично обновляем UI
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set(state => ({
        bookings: state.bookings.map(booking =>
          booking.bookingRequestId === requestId
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? { ...booking, bookingRequest: { ...booking.bookingRequest, status: newStatus as any } }
            : booking
        ),
        filteredBookings: state.filteredBookings.map(booking =>
          booking.bookingRequestId === requestId
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? { ...booking, bookingRequest: { ...booking.bookingRequest, status: newStatus as any } }
            : booking
        )
      }));
    } catch (error) {
      console.error("Error updating request status:", error);
      set({
        error: error instanceof Error ? error.message : "Неизвестная ошибка при обновлении статуса заявки"
      });
    }
  },

  applyFilters: (filters: RequestFilterState) => {
    const { bookings } = get();
    let filtered = bookings;

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((booking) => booking.bookingRequest.status === filters.status);
    }

    // Другие фильтры могут быть применены здесь

    set({ filters, filteredBookings: filtered });
  },

  resetFilters: () => {
    set({
      filters: {
        status: "",
        supplierName: "",
        dateFrom: "",
        dateTo: "",
      },
      filteredBookings: get().bookings
    });
  }
}));

/**
 * Простой store для уведомлений о результатах действий с бронированиями
 */
export const useBookingToasts = () => {
  const { toast } = useToastHook();

  const showSuccessToast = useCallback((title: string, description: string) => {
    toast({
      title,
      description,
    });
  }, [toast]);

  const showErrorToast = useCallback((title: string, description: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  }, [toast]);

  return { showSuccessToast, showErrorToast };
};
