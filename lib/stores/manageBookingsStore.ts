import { create } from 'zustand';
import { BookingRequest, type Booking, User, Zone, BookingStatus, Role } from '@prisma/client';

// Add this type definition
export type BookingRequestWithBookings = BookingRequest & {
    bookings: (Booking & { zone: Zone; bookingRequest: BookingRequest })[];
    supplier: User | null;
    user: User;
    supplierName: string;
};

// Define a supplier type
export interface Supplier {
    inn: string;
    name: string;
}

// Define a type for filters
export interface BookingFilters {
    status: string[];
    supplierName?: string;
    dateFrom?: string;
    dateTo?: string;
    supplierInn?: string; // Added for filtering by supplier INN (for single supplier filter)
    supplier?: string[]; // Added for filtering by multiple suppliers

    // New filters similar to BookingFilters.tsx
    city?: string[];
    market?: string[];
    macrozone?: string[];
    equipment?: string[];
    searchTerm?: string; // For general search across multiple fields

    [key: string]: string | string[] | undefined; // Allow for additional filter properties with specific types
}

interface ManageBookingsState {
    // Data
    allBookings: BookingRequestWithBookings[];
    filteredBookings: BookingRequestWithBookings[];
    isLoading: boolean;
    error: string | null;

    // Unique values for filters
    uniqueSuppliers: Supplier[];
    uniqueCities: string[];
    uniqueMarkets: string[];
    uniqueMacrozones: string[];
    uniqueEquipments: string[];

    // Filters
    filters: BookingFilters;

    // Actions
    fetchBookings: () => Promise<void>;
    setFilters: (filters: Partial<BookingFilters>) => void;
    resetFilters: () => void;
    applyFilters: () => void;
}

// Helper functions to extract unique values from bookings are defined below

// Helper functions to extract unique values from bookings
const extractUniqueSuppliers = (bookings: BookingRequestWithBookings[]): Supplier[] => {
    const suppliersMap = new Map<string, Supplier>();

    bookings.forEach(booking => {
        if (booking.supplier && booking.supplier.inn) {
            suppliersMap.set(booking.supplier.inn, {
                inn: booking.supplier.inn,
                name: booking.supplierName || booking.supplier.name || booking.supplier.inn
            });
        }
    });

    return Array.from(suppliersMap.values());
};

const extractUniqueCities = (bookings: BookingRequestWithBookings[]): string[] => {
    const citiesSet = new Set<string>();

    bookings.forEach(booking => {
        booking.bookings.forEach(b => {
            if (b.zone.city) {
                citiesSet.add(b.zone.city);
            }
        });
    });

    return Array.from(citiesSet);
};

const extractUniqueMarkets = (bookings: BookingRequestWithBookings[]): string[] => {
    const marketsSet = new Set<string>();

    bookings.forEach(booking => {
        booking.bookings.forEach(b => {
            if (b.zone.market) {
                marketsSet.add(b.zone.market);
            }
        });
    });

    return Array.from(marketsSet);
};

const extractUniqueMacrozones = (bookings: BookingRequestWithBookings[]): string[] => {
    const macrozonesSet = new Set<string>();

    bookings.forEach(booking => {
        booking.bookings.forEach(b => {
            if (b.zone.mainMacrozone) {
                macrozonesSet.add(b.zone.mainMacrozone);
            }
        });
    });

    return Array.from(macrozonesSet);
};

const extractUniqueEquipments = (bookings: BookingRequestWithBookings[]): string[] => {
    const equipmentsSet = new Set<string>();

    bookings.forEach(booking => {
        booking.bookings.forEach(b => {
            if (b.zone.equipment) {
                equipmentsSet.add(b.zone.equipment);
            }
        });
    });

    return Array.from(equipmentsSet);
};

export const useManageBookingsStore = create<ManageBookingsState>((set, get) => ({
    // Initial state
    allBookings: [],
    filteredBookings: [],
    isLoading: false,
    error: null,
    uniqueSuppliers: [],
    uniqueCities: [],
    uniqueMarkets: [],
    uniqueMacrozones: [],
    uniqueEquipments: [],
    filters: {
        status: [],
        supplierName: '',
        dateFrom: '',
        dateTo: '',
        supplierInn: '',
        supplier: [],
        // Initialize new filters
        city: [],
        market: [],
        macrozone: [],
        equipment: [],
        searchTerm: '',
    },

    // Fetch bookings from API
    fetchBookings: async () => {
        set({ isLoading: true, error: null });
        try {
            // Use the API route
            const response = await fetch('/api/bookings');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch bookings');
            }

            const bookings = await response.json();
            console.log('Bookings from API:', bookings);

            const bookingsData = bookings as BookingRequestWithBookings[];

            // Extract unique values for filters
            const uniqueSuppliers = extractUniqueSuppliers(bookingsData);
            const uniqueCities = extractUniqueCities(bookingsData);
            const uniqueMarkets = extractUniqueMarkets(bookingsData);
            const uniqueMacrozones = extractUniqueMacrozones(bookingsData);
            const uniqueEquipments = extractUniqueEquipments(bookingsData);

            set({
                allBookings: bookingsData,
                uniqueSuppliers,
                uniqueCities,
                uniqueMarkets,
                uniqueMacrozones,
                uniqueEquipments,
                isLoading: false
            });

            // Apply any existing filters
            get().applyFilters();
        } catch (error: unknown) {
            console.error('Error fetching bookings:', error);
            set({
                error: error instanceof Error ? error.message : 'An unknown error occurred',
                isLoading: false,
            });
        }
    },

    // Set filters
    setFilters: (newFilters: Partial<BookingFilters>) => {
        set((state) => ({
            filters: { ...state.filters, ...newFilters }
        }));
        get().applyFilters();
    },

    // Reset filters
    resetFilters: () => {
        // Сохраняем текущий supplierInn, чтобы поставщик видел только свои бронирования
        const currentSupplierInn = get().filters.supplierInn;

        set({
            filters: {
                status: [],
                supplierName: '',
                dateFrom: '',
                dateTo: '',
                // Сохраняем supplierInn для поставщика
                supplierInn: currentSupplierInn,
                supplier: [],
                // Reset new filters
                city: [],
                market: [],
                macrozone: [],
                equipment: [],
                searchTerm: '',
            }
        });
        get().applyFilters();
    },

    // Apply filters to bookings
    applyFilters: () => {
        set((state) => {
            const { allBookings, filters } = state;

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

            // Filter by city
            if (filters.city && filters.city.length > 0) {
                filtered = filtered.filter(booking => {
                    return booking.bookings.some(b =>
                        filters.city!.includes(b.zone.city)
                    );
                });
            }

            // Filter by market
            if (filters.market && filters.market.length > 0) {
                filtered = filtered.filter(booking => {
                    return booking.bookings.some(b =>
                        filters.market!.includes(b.zone.market)
                    );
                });
            }

            // Filter by macrozone
            if (filters.macrozone && filters.macrozone.length > 0) {
                filtered = filtered.filter(booking => {
                    return booking.bookings.some(b =>
                        filters.macrozone!.includes(b.zone.mainMacrozone)
                    );
                });
            }

            // Filter by equipment
            if (filters.equipment && filters.equipment.length > 0) {
                filtered = filtered.filter(booking => {
                    return booking.bookings.some(b =>
                        filters.equipment!.includes(b.zone.equipment)
                    );
                });
            }

            // General search term (across multiple fields)
            if (filters.searchTerm && filters.searchTerm.trim() !== '') {
                const searchTerm = filters.searchTerm.toLowerCase().trim();
                filtered = filtered.filter(booking => {
                    // Search in booking request fields
                    if (booking.supplierName.toLowerCase().includes(searchTerm)) {
                        return true;
                    }

                    // Search in individual bookings
                    return booking.bookings.some(b =>
                        b.zone.city.toLowerCase().includes(searchTerm) ||
                        b.zone.market.toLowerCase().includes(searchTerm) ||
                        b.zone.mainMacrozone.toLowerCase().includes(searchTerm) ||
                        b.zone.equipment.toLowerCase().includes(searchTerm) ||
                        b.zone.uniqueIdentifier.toLowerCase().includes(searchTerm)
                    );
                });
            }

            console.log('Applied filters:', filters);
            console.log('Filtered bookings count:', filtered.length);

            return { filteredBookings: filtered };
        });
    },
}));