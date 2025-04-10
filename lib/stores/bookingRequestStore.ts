import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { BookingRequest, type Booking, User, Zone, BookingStatus, type Brand } from '@prisma/client';
import { getSession } from 'next-auth/react';
// Remove useLoaderStore import
// import { useLoaderStore } from './loaderStore';
// Import the new utility and ApiError
import { fetchWithLoading, ApiError } from '@/lib/utils/api'; // Adjust path if necessary

// --- Types ---

// Keep existing type
export type BookingRequestWithBookings = BookingRequest & {
    bookings: (Booking & { zone: Zone; bookingRequest: BookingRequest; brand: Brand | null })[];
    supplier: User | null;
    user: User;
    supplierName: string;
};

// Keep existing filter type
export interface BookingRequestFilters {
    status: BookingStatus[];
    supplierName?: string;
    dateFrom?: string;
    dateTo?: string;
    supplierInn?: string;
    supplierIds?: string[];
    city?: string[];
    market?: string[];
    macrozone?: string[];
    equipment?: string[];
    searchTerm?: string;
}

// Type for supplier options fetched from API
export interface SupplierOption {
    inn: string;
    name: string;
}

// Type for all filter options fetched from API
export interface FilterOptions {
    cities: string[];
    markets: string[];
    macrozones: string[];
    equipments: string[];
    suppliers: SupplierOption[];
}

// Define the store state with pagination AND filter options
interface BookingRequestState {
    // Core State
    bookingRequests: BookingRequestWithBookings[];
    error: string | null;
    isLoading: boolean; // Add local loading state for main data

    // Criteria State
    filterCriteria: BookingRequestFilters;

    // Pagination State
    page: number;
    pageSize: number;
    totalCount: number;
    newCount: number; // Add state for new count

    // Filter Options State
    filterOptions: FilterOptions;
    isLoadingOptions: boolean; // Separate loading state for options
    optionsError: string | null;

    // Actions
    fetchBookingRequests: (page?: number, pageSize?: number) => Promise<void>;
    fetchFilterOptions: (context?: 'create' | 'manage') => Promise<void>; // Accept optional context
    setFilterCriteria: (criteria: Partial<BookingRequestFilters>) => void;
    updateBookingRequestLocally: (requestId: string, updates: Partial<BookingRequestWithBookings>) => void;
    updateBookingStatusLocally: (bookingId: string, newStatus: BookingStatus) => void;
    resetFilters: () => void;
    setPage: (page: number) => void;
    setPageSize: (pageSize: number) => void;
}

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

const initialPagination = {
    page: 1,
    pageSize: 20,
    totalCount: 0,
    newCount: 0, // Initialize new count
};

const initialFilterOptions: FilterOptions = {
    cities: [],
    markets: [],
    macrozones: [],
    equipments: [],
    suppliers: [],
};

// --- Store Definition ---

export const useBookingRequestStore = create<BookingRequestState>()(
    devtools(
        (set, get) => ({
            // Core State
            bookingRequests: [],
            error: null,
            isLoading: false, // Initialize local loading state

            // Criteria State
            filterCriteria: initialFilterCriteria,

            // Pagination State
            ...initialPagination,

            // Filter Options State
            filterOptions: initialFilterOptions,
            isLoadingOptions: false,
            optionsError: null,

            // --- Actions ---

            fetchBookingRequests: async (page = get().page, pageSize = get().pageSize) => {
                console.log(`fetchBookingRequests action started for page: ${page}, pageSize: ${pageSize}`);
                // Remove direct loader import: const { withLoading } = useLoaderStore.getState();
                const session = await getSession();

                if (!session) {
                    console.log("fetchBookingRequests: No active session, skipping fetch.");
                    set({ bookingRequests: [], totalCount: 0, page: 1, error: null, isLoading: false }); // Reset loading
                    return;
                }

                // Set local loading state
                set({ isLoading: true, error: null });

                try {
                    const currentFilters = get().filterCriteria;
                    const params = new URLSearchParams();
                    params.append('page', page.toString());
                    params.append('pageSize', pageSize.toString());

                    Object.entries(currentFilters).forEach(([key, value]) => {
                        if (value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0)) {
                            if (Array.isArray(value)) {
                                value.forEach(item => params.append(key, item));
                            } else {
                                params.append(key, String(value));
                            }
                        }
                    });

                    const url = `/api/bookings?${params.toString()}`;
                    console.log(`Fetching /api/bookings with params: ${params.toString()}`);

                    // Use fetchWithLoading
                    const result = await fetchWithLoading<{ data: BookingRequestWithBookings[], totalCount: number, newCount: number }>( // Expect newCount
                        url,
                        'GET',
                        'Загрузка заявок...'
                    );

                    // Add check for newCount
                    if (!result || typeof result.totalCount !== 'number' || typeof result.newCount !== 'number' || !Array.isArray(result.data)) {
                        console.error("Invalid API response structure:", result);
                        throw new Error('Invalid API response structure received.');
                    }

                    console.log(`[Store] Fetched ${result.data.length} Booking Requests (Total: ${result.totalCount}, New: ${result.newCount})`);
                    set({
                        bookingRequests: result.data,
                        totalCount: result.totalCount,
                        newCount: result.newCount, // Store newCount
                        page: page,
                        pageSize: pageSize,
                        isLoading: false, // Reset loading
                        error: null,
                    });
                } catch (error) {
                    let errorMessage = "Unknown error fetching booking requests";
                    // Handle potential ApiError from fetchWithLoading
                    if (error instanceof ApiError) {
                        // Handle specific statuses like 401 if needed
                        if (error.status === 401) {
                            console.warn("fetchBookingRequests: Received 401 Unauthorized."); // Keep 401 handling
                            set({ bookingRequests: [], totalCount: 0, page: 1, error: null, isLoading: false });
                            return; // Exit early for 401
                        }
                        errorMessage = error.message;
                    } else if (error instanceof Error) {
                        errorMessage = error.message;
                    }
                    console.error("Error fetching booking requests:", errorMessage);
                    set({ error: errorMessage, isLoading: false, bookingRequests: [], totalCount: 0, newCount: 0 }); // Reset newCount on error too
                }
            },

            fetchFilterOptions: async (context = 'manage') => { // Default context to 'manage'
                console.log('fetchFilterOptions action started');
                // Remove direct loader import: const { withLoading } = useLoaderStore.getState();

                set({ isLoadingOptions: true, optionsError: null }); // Manage specific loading state

                try {
                    const session = await getSession();
                    if (!session) {
                        console.log("fetchFilterOptions: No active session, skipping fetch.");
                        set({ filterOptions: initialFilterOptions, isLoadingOptions: false });
                        return;
                    }

                    const apiUrl = `/api/bookings/filter-options?context=${context}`;
                    console.log(`Fetching filter options with URL: ${apiUrl}`);

                    // Use fetchWithLoading
                    const fetchedOptions = await fetchWithLoading<FilterOptions>(
                        apiUrl,
                        'GET',
                        'Загрузка опций фильтров...'
                    );

                    if (!fetchedOptions || !Array.isArray(fetchedOptions.cities) || !Array.isArray(fetchedOptions.suppliers)) {
                        console.error("Invalid filter options response structure:", fetchedOptions);
                        throw new Error('Invalid filter options response structure received.');
                    }

                    console.log('[Store] Fetched Filter Options:', fetchedOptions);
                    set({
                        filterOptions: fetchedOptions,
                        isLoadingOptions: false, // Reset loading
                        optionsError: null,
                    });

                } catch (error) {
                    let errorMessage = "Unknown error fetching filter options";
                    // Handle potential ApiError from fetchWithLoading
                    if (error instanceof ApiError) {
                        // Handle specific statuses like 401 if needed
                        if (error.status === 401) {
                            console.warn("fetchFilterOptions: Received 401 Unauthorized.");
                            set({ filterOptions: initialFilterOptions, isLoadingOptions: false, optionsError: null }); // Reset loading, clear error
                            return; // Exit early for 401
                        }
                        errorMessage = error.message;
                    } else if (error instanceof Error) {
                        errorMessage = error.message;
                    }
                    console.error("Error fetching filter options:", errorMessage);
                    set({ optionsError: errorMessage, isLoadingOptions: false, filterOptions: initialFilterOptions }); // Reset loading
                }
            },

            setFilterCriteria: (criteriaUpdate) => {
                const newCriteria = { ...get().filterCriteria, ...criteriaUpdate };
                set({ filterCriteria: newCriteria, page: 1 });
                get().fetchBookingRequests(1, get().pageSize); // Will use fetchWithLoading
            },

            updateBookingRequestLocally: (requestId, updates) => {
                set((state) => ({
                    bookingRequests: state.bookingRequests.map(req =>
                        req.id === requestId ? { ...req, ...updates } : req
                    )
                }));
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
            },

            resetFilters: () => {
                set({ filterCriteria: initialFilterCriteria, page: 1 });
                get().fetchBookingRequests(1, get().pageSize); // Will use fetchWithLoading
            },

            setPage: (newPage) => {
                if (newPage !== get().page) {
                    set({ page: newPage });
                    get().fetchBookingRequests(newPage, get().pageSize); // Will use fetchWithLoading
                }
            },

            setPageSize: (newPageSize) => {
                if (newPageSize !== get().pageSize) {
                    set({ pageSize: newPageSize, page: 1 });
                    get().fetchBookingRequests(1, newPageSize); // Will use fetchWithLoading
                }
            },
        }),
        { name: 'bookingRequestStore' }
    )
);