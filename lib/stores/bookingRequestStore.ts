import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { BookingRequest, type Booking, User, Zone, BookingStatus } from '@prisma/client';
import { getSession } from 'next-auth/react'; // Import getSession

// --- Types ---

// Replicated from old stores, might need adjustment based on API/Prisma schema
export type BookingRequestWithBookings = BookingRequest & {
    bookings: (Booking & { zone: Zone; bookingRequest: BookingRequest })[];
    supplier: User | null;
    user: User;
    supplierName: string; // Ensure this is consistently available from API
};

// Define a simplified supplier type for filters
export interface SimpleSupplier {
    inn: string;
    name: string;
}

// Define filter criteria type
export interface BookingRequestFilters {
    status: BookingStatus[];
    supplierName?: string; // Search term for supplier name
    dateFrom?: string;
    dateTo?: string;
    supplierInn?: string; // Specific INN for filtering (e.g., for supplier role)
    supplierIds?: string[]; // For multi-select supplier filter (using INN or unique ID)
    city?: string[];
    market?: string[];
    macrozone?: string[];
    equipment?: string[];
    searchTerm?: string; // General search across multiple fields
}

// Define unique values type for populating filter options
interface UniqueFilterValues {
    suppliers: SimpleSupplier[];
    cities: string[];
    markets: string[];
    macrozones: string[];
    equipments: string[];
    statuses: BookingStatus[];
}

// Define the store state
interface BookingRequestState {
    // Core State
    bookingRequests: BookingRequestWithBookings[];
    isLoading: boolean;
    error: string | null;

    // Criteria State
    filterCriteria: BookingRequestFilters;

    // Derived State
    filteredBookingRequests: BookingRequestWithBookings[];
    uniqueFilterValues: UniqueFilterValues;

    // Actions
    fetchBookingRequests: () => Promise<void>;
    setFilterCriteria: (criteria: Partial<BookingRequestFilters>) => void;
    updateBookingRequestLocally: (requestId: string, updates: Partial<BookingRequestWithBookings>) => void; // For optimistic UI or updates after actions
    updateBookingStatusLocally: (bookingId: string, newStatus: BookingStatus) => void; // Specific local update for booking status
    resetFilters: () => void;
    _recalculateDerivedState: () => void; // Internal action
}

// --- Helper Functions ---

// Extract unique values for filters
const calculateUniqueValues = (requests: BookingRequestWithBookings[]): UniqueFilterValues => {
    const suppliersMap = new Map<string, SimpleSupplier>();
    const citiesSet = new Set<string>();
    const marketsSet = new Set<string>();
    const macrozonesSet = new Set<string>();
    const equipmentsSet = new Set<string>();
    const statusesSet = new Set<BookingStatus>();

    requests.forEach(req => {
        // Suppliers
        if (req.supplier && req.supplier.inn && req.supplier.name) {
            suppliersMap.set(req.supplier.inn, { inn: req.supplier.inn, name: req.supplier.name });
        } else if (req.supplierName && req.supplierName !== 'N/A') {
            // Fallback if supplier relation isn't loaded but name exists
            // Use name as key if INN is missing, less reliable
            if (!Array.from(suppliersMap.values()).some(s => s.name.toLowerCase() === req.supplierName.toLowerCase())) {
                suppliersMap.set(req.supplierName, { inn: req.supplierName, name: req.supplierName });
            }
        }

        // Zone attributes and statuses from nested bookings
        req.bookings.forEach(b => {
            if (b.zone) {
                if (b.zone.city) citiesSet.add(b.zone.city);
                if (b.zone.market) marketsSet.add(b.zone.market);
                if (b.zone.mainMacrozone) macrozonesSet.add(b.zone.mainMacrozone);
                if (b.zone.equipment) equipmentsSet.add(b.zone.equipment);
            }
            statusesSet.add(b.status);
        });
    });

    return {
        suppliers: Array.from(suppliersMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
        cities: Array.from(citiesSet).sort(),
        markets: Array.from(marketsSet).sort(),
        macrozones: Array.from(macrozonesSet).sort(),
        equipments: Array.from(equipmentsSet).sort(),
        statuses: Array.from(statusesSet).sort(),
    };
};

// Apply filters to booking requests
const applyFilters = (requests: BookingRequestWithBookings[], filters: BookingRequestFilters): BookingRequestWithBookings[] => {
    let filtered = [...requests];

    // Filter by status (any booking within the request must match)
    if (filters.status && filters.status.length > 0) {
        filtered = filtered.filter(req => req.bookings.some(b => filters.status.includes(b.status)));
    }

    // Filter by supplier name (search term)
    if (filters.supplierName && filters.supplierName.trim() !== '') {
        const term = filters.supplierName.toLowerCase().trim();
        filtered = filtered.filter(req => req.supplierName?.toLowerCase().includes(term));
    }

    // Filter by date range (createdAt of the request)
    if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom).setHours(0, 0, 0, 0);
        filtered = filtered.filter(req => new Date(req.createdAt).setHours(0, 0, 0, 0) >= fromDate);
    }
    if (filters.dateTo) {
        const toDate = new Date(filters.dateTo).setHours(23, 59, 59, 999);
        filtered = filtered.filter(req => new Date(req.createdAt).getTime() <= toDate); // Convert Date to timestamp
    }

    // Filter by specific supplier INN (for supplier role)
    if (filters.supplierInn) {
        filtered = filtered.filter(req => req.supplier?.inn === filters.supplierInn);
    }

    // Filter by multiple selected supplier IDs (INN or name as fallback)
    if (filters.supplierIds && filters.supplierIds.length > 0) {
        filtered = filtered.filter(req => {
            const supplierId = req.supplier?.inn || req.supplierName; // Use INN first, fallback to name
            return supplierId && filters.supplierIds!.includes(supplierId);
        });
    }

    // Filter by zone attributes (any booking within the request must match)
    if (filters.city && filters.city.length > 0) {
        filtered = filtered.filter(req => req.bookings.some(b => b.zone?.city && filters.city!.includes(b.zone.city)));
    }
    if (filters.market && filters.market.length > 0) {
        filtered = filtered.filter(req => req.bookings.some(b => b.zone?.market && filters.market!.includes(b.zone.market)));
    }
    if (filters.macrozone && filters.macrozone.length > 0) {
        filtered = filtered.filter(req => req.bookings.some(b => b.zone?.mainMacrozone && filters.macrozone!.includes(b.zone.mainMacrozone)));
    }
    if (filters.equipment && filters.equipment.length > 0) {
        filtered = filtered.filter(req => req.bookings.some(b => b.zone?.equipment && filters.equipment!.includes(b.zone.equipment)));
    }

    // General search term (across request and nested booking fields)
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const term = filters.searchTerm.toLowerCase().trim();
        filtered = filtered.filter(req => {
            // Search basic request fields
            if (req.supplierName?.toLowerCase().includes(term) ||
                req.user?.name?.toLowerCase().includes(term) ||
                req.user?.email?.toLowerCase().includes(term)) {
                return true;
            }
            // Search nested booking/zone fields
            return req.bookings.some(b =>
                b.zone?.uniqueIdentifier?.toLowerCase().includes(term) ||
                b.zone?.city?.toLowerCase().includes(term) ||
                b.zone?.market?.toLowerCase().includes(term) ||
                b.zone?.mainMacrozone?.toLowerCase().includes(term) ||
                b.zone?.equipment?.toLowerCase().includes(term) ||
                b.zone?.supplier?.toLowerCase().includes(term)
            );
        });
    }

    return filtered;
};


// --- Initial State ---

const initialFilterCriteria: BookingRequestFilters = {
    status: [],
    supplierName: '',
    dateFrom: '',
    dateTo: '',
    supplierInn: '',
    supplierIds: [],
    city: [],
    market: [],
    macrozone: [],
    equipment: [],
    searchTerm: '',
};

// --- Store Definition ---

export const useBookingRequestStore = create<BookingRequestState>()(
    devtools(
        (set, get) => ({
            // Core State
            bookingRequests: [],
            isLoading: false,
            error: null,

            // Criteria State
            filterCriteria: initialFilterCriteria,

            // Derived State
            filteredBookingRequests: [],
            uniqueFilterValues: { suppliers: [], cities: [], markets: [], macrozones: [], equipments: [], statuses: [] },

            // --- Internal Action ---
            _recalculateDerivedState: () => {
                const { bookingRequests, filterCriteria } = get();
                const filtered = applyFilters(bookingRequests, filterCriteria);
                set({ filteredBookingRequests: filtered });
            },

            // --- Public Actions ---
            fetchBookingRequests: async () => {
                // Check if user is authenticated before fetching
                const session = await getSession();
                if (!session) {
                    console.log("fetchBookingRequests: No active session, skipping fetch.");
                    // Optionally reset state if needed when unauthenticated
                    // set({ bookingRequests: [], filteredBookingRequests: [], isLoading: false, error: null });
                    return;
                }

                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/bookings'); // Assuming this fetches BookingRequestWithBookings
                    if (!response.ok) {
                        // Check for 401 specifically, maybe don't set error state in that case?
                        if (response.status === 401) {
                             console.warn("fetchBookingRequests: Received 401 Unauthorized. Session might have expired or is invalid.");
                             // Decide if we should set an error state or just clear data
                             set({ isLoading: false, bookingRequests: [], filteredBookingRequests: [] }); // Clear data on auth error
                             return; // Exit without setting error state which might trigger toasts
                        }
                        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch booking requests' }));
                        throw new Error(errorData.error || 'Failed to fetch booking requests');
                    }
                    const fetchedRequests: BookingRequestWithBookings[] = await response.json();

                    set({
                        bookingRequests: fetchedRequests,
                        isLoading: false,
                        uniqueFilterValues: calculateUniqueValues(fetchedRequests),
                    });
                    get()._recalculateDerivedState(); // Apply initial filters
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error fetching booking requests";
                    console.error("Error fetching booking requests:", errorMessage);
                    // Avoid setting error state if it's an expected Unauthorized error after logout
                    if (errorMessage !== 'Unauthorized') { // Check if error message indicates unauthorized
                       set({ error: errorMessage, isLoading: false, bookingRequests: [], filteredBookingRequests: [] });
                    } else {
                       set({ isLoading: false, bookingRequests: [], filteredBookingRequests: [] }); // Clear data but don't set error
                    }
                }
            },

            setFilterCriteria: (criteriaUpdate) => {
                set((state) => ({
                    filterCriteria: { ...state.filterCriteria, ...criteriaUpdate },
                }));
                get()._recalculateDerivedState();
            },

            updateBookingRequestLocally: (requestId, updates) => {
                set((state) => ({
                    bookingRequests: state.bookingRequests.map(req =>
                        req.id === requestId ? { ...req, ...updates } : req
                    )
                }));
                // Recalculate derived state as filters might be affected
                get()._recalculateDerivedState();
                // Optionally recalculate unique values if relevant fields changed
                // set({ uniqueFilterValues: calculateUniqueValues(get().bookingRequests) });
            },

            updateBookingStatusLocally: (bookingId, newStatus) => {
                set((state) => ({
                    bookingRequests: state.bookingRequests.map(req => ({
                        ...req,
                        bookings: req.bookings.map(b =>
                            b.id === bookingId ? { ...b, status: newStatus } : b
                        )
                    }))
                }));
                // Recalculate derived state as status filter might be affected
                get()._recalculateDerivedState();
                // Optionally recalculate unique statuses
                // set({ uniqueFilterValues: calculateUniqueValues(get().bookingRequests) });
            },

            resetFilters: () => {
                set({ filterCriteria: initialFilterCriteria });
                get()._recalculateDerivedState();
            },
        }),
        { name: 'bookingRequestStore' }
    )
);