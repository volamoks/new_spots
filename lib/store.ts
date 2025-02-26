import { create } from "zustand";
import type { RequestFilterState } from "@/app/components/RequestFilters";
import { produce } from "immer";
import { BookingRequestWithBookings } from "@/types/booking";
import { Zone, ZoneStatus } from "@prisma/client";

// Определение типа пользовательской роли
export type UserRole = "supplier" | "category_manager" | "dmp_manager"

type User = {
  id: string
  name: string
  email: string
  role: UserRole
}


type Request = {
  id: number
  supplierName: string
  dateCreated: string
  dateRange: string
  zones: Zone[]
}

// Add this to the GlobalState interface
interface GlobalState {
  // Category Manager Dashboard
  selectedSupplier: string
  selectedZones: string[]
  suppliers: string[]
  supplierData: {
    brands: string[]
    locations: string[]
    totalSpots: number
    spotsPerLocation: { city: string; count: number }[]
    spotsPerBrand: { brand: string; count: number }[]
    zones: Zone[]
  } | null
  setSelectedSupplier: (supplier: string) => void
  toggleZoneSelection: (zoneId: string) => void
  clearSelectedZones: () => void

  // Requests
  requests: Request[]
  filteredRequests: Request[]
  handleApprove: (requestId: number, zoneId: string) => void
  handleReject: (requestId: number, zoneId: string) => void
  handleFilterChange: (filters: RequestFilterState) => void

  // Zones
  zones: Zone[]
  filteredZones: Zone[]
  filters: {
    category: string
    macrozone: string
    cities: string[]
    storeCategories: string[]
    equipment: string[]
  }
  setFilters: (filters: Partial<GlobalState['filters']>) => void;
  toggleZoneSelectionForBooking: (zoneId: string) => void;
  handleBooking: () => void;
  // Auth state
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  switchRole: (role: UserRole) => void

  // Bookings
  bookingRequests: BookingRequestWithBookings[]
  setBookingRequests: (
    bookingRequests: BookingRequestWithBookings[] | ((prev: BookingRequestWithBookings[]) => BookingRequestWithBookings[])
  ) => void
  userBookings: BookingRequestWithBookings[] // Устаревшее поле, оставлено для обратной совместимости
  setUserBookings: (bookings: BookingRequestWithBookings[] | ((prev: BookingRequestWithBookings[]) => BookingRequestWithBookings[])) => void

  // Добавьте в интерфейс GlobalState:
  step: number
  setStep: (step: number) => void

  // Добавим для загрузки данных
  isZonesLoading: boolean
  fetchZonesFromDB: () => Promise<void>
}


// Update the create function to include auth state and functions
export const useGlobalStore = create<GlobalState>((set, get) => ({
  // Category Manager Dashboard
  selectedSupplier: "",
  selectedZones: [],
  suppliers: [],
  supplierData: null,

  setSelectedSupplier: (supplier) => {
    set({ selectedSupplier: supplier });
    const filteredZones = get().zones.filter((zone) => zone.supplier === supplier);
    const brands = [...Array.from(new Set(filteredZones.map((zone) => zone.brand)))].filter(Boolean) as string[];
    const locations = [...Array.from(new Set(filteredZones.map((zone) => zone.city)))].filter(Boolean) as string[];
    const totalSpots = filteredZones.length;
    const spotsPerLocation = locations.map((location) => ({
      city: location,
      count: filteredZones.filter((zone) => zone.city === location).length,
    }));
    const spotsPerBrand = brands.map((brand) => ({
      brand,
      count: filteredZones.filter((zone) => zone.brand === brand).length,
    }));
    set({
      supplierData: {
        brands,
        locations,
        totalSpots,
        spotsPerLocation,
        spotsPerBrand,
        zones: filteredZones,
      },
    });
  },
  toggleZoneSelection: (zoneId) => {
    set((state) => ({
      selectedZones: state.selectedZones.includes(zoneId)
        ? state.selectedZones.filter((id) => id !== zoneId)
        : [...state.selectedZones, zoneId],
    }))
  },
  clearSelectedZones: () => set({ selectedZones: [] }),

  // Requests
  requests: [],
  filteredRequests: [],
  handleApprove: (requestId: number, zoneId: string) => {
    set(
      produce((state: GlobalState) => {
        const request = state.requests.find((r) => r.id === requestId);
        if (request) {
          const zone = request.zones.find((z) => z.id === zoneId);
          if (zone) {
            zone.status = ZoneStatus.BOOKED
          }
        }
        state.filteredRequests = state.requests;
      })
    );
  },
  handleReject: (requestId: number, zoneId: string) => {
    set(
      produce((state: GlobalState) => {
        const request = state.requests.find((r) => r.id === requestId);
        if (request) {
          const zone = request.zones.find((z) => z.id === zoneId);
          if (zone) {
            zone.status = ZoneStatus.UNAVAILABLE
          }
        }
        state.filteredRequests = state.requests;
      })
    );
  },
  handleFilterChange: (filters) => {
    set((state) => {
      let filtered = state.requests

      if (filters.status) {
        filtered = filtered.filter((request) => request.zones.some((zone) => zone.status === filters.status))
      }

      if (filters.supplierName) {
        filtered = filtered.filter((request) =>
          request.supplierName.toLowerCase().includes(filters.supplierName.toLowerCase()),
        )
      }

      if (filters.dateFrom) {
        filtered = filtered.filter((request) => new Date(request.dateCreated) >= new Date(filters.dateFrom))
      }

      if (filters.dateTo) {
        filtered = filtered.filter((request) => new Date(request.dateCreated) <= new Date(filters.dateTo))
      }

      return { filteredRequests: filtered }
    })
  },

  // Zones
  zones: [],
  filteredZones: [],
  filters: {
    category: "",
    macrozone: "",
    cities: [],
    storeCategories: [],
    equipment: [],
  },
  setFilters: (newFilters) => {
    set(
      produce((state: GlobalState) => {
        state.filters = { ...state.filters, ...newFilters }
        state.filteredZones = state.zones.filter((zone) => {
          if (state.filters.category && zone.mainMacrozone !== state.filters.category) {
            return false
          }
          if (state.filters.macrozone) {
            const adjacentMacrozones = zone.adjacentMacrozone.split("/")
            if (!adjacentMacrozones.includes(state.filters.macrozone)) {
              return false
            }
          }
          if (state.filters.cities.length > 0 && !state.filters.cities.includes(zone.city)) {
            return false
          }
          if (
            state.filters.storeCategories.length > 0 &&
            !state.filters.storeCategories.includes(zone.market)
          ) {
            return false
          }
          if (state.filters.equipment.length > 0 && !state.filters.equipment.includes(zone.equipment)) {
            return false
          }
          return true
        })
      }),
    )
  },
  toggleZoneSelectionForBooking: (zoneId) => {
    set(
      produce((state) => {
        const index = state.selectedZones.indexOf(zoneId)
        if (index > -1) {
          state.selectedZones.splice(index, 1)
        } else {
          state.selectedZones.push(zoneId)
        }
      }),
    )
  },
  handleBooking: () => {
    console.log("Бронирование зон:", get().selectedZones)
    set({ selectedZones: [] })
  },

  // Auth state
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
  switchRole: (role) =>
    set((state) => ({
      user: state.user ? { ...state.user, role } : null,
    })),

  // Bookings
  bookingRequests: [],
  setBookingRequests: (bookingRequestsOrFn) =>
    set((state) => ({
      bookingRequests: typeof bookingRequestsOrFn === 'function'
        ? bookingRequestsOrFn(state.bookingRequests)
        : bookingRequestsOrFn
    })),
  userBookings: [], // Устаревшее поле, оставлено для обратной совместимости
  setUserBookings: (bookingsOrFn) =>
    set((state) => ({
      userBookings: typeof bookingsOrFn === 'function'
        ? bookingsOrFn(state.userBookings)
        : bookingsOrFn
    })),

  // Добавьте в create функцию:
  step: 1,
  setStep: (step) => set({ step }),

  // Добавляем isZonesLoading и fetchZonesFromDB
  isZonesLoading: false,
  fetchZonesFromDB: async () => {
    set({ isZonesLoading: true });
    try {
      const { macrozone } = get().filters
      const response = await fetch(`/api/zones?macrozone=${macrozone}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const zones = await response.json();
      set({ zones, filteredZones: zones });
    } catch (error) {
      console.error("Error fetching zones from DB:", error);
      // TODO: Handle error (e.g., show error message to user)
    } finally {
      set({ isZonesLoading: false });
    }
  },
}));

