'use client';

import { useEffect } from 'react'; // Removed unused useCallback
import { useAuth } from '@/lib/hooks/useAuth';
import { KM_CATEGORY_MAP } from '@/lib/constants/kmCategories'; // Import the map
import { useBookingActionsStore } from '@/lib/stores/bookingActionsStore';
import { useZonesStore } from '@/lib/stores/zonesStore';
import { ZonePagination } from '@/app/components/zones/ZonePagination';
import CategorySelection from '../booking/CategorySelection';
import { BrandSelector } from '../booking/BrandSelector'; // Import BrandSelector
import BookingFilters from '../booking/BookingFilters';
import ZonesTable from '../booking/ZonesTable';

import SupplierSelection from '../booking/SupplierSelection';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation'; // Correct import for App Router

export default function CreateBookingPage() {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter(); // Initialize the router hook

    const setSelectedSupplierInnForCreation = useBookingActionsStore(
        state => state.setSelectedSupplierInnForCreation,
    );
    const selectedBrandId = useBookingActionsStore(state => state.selectedBrandId); // Get selected brand ID
    const setSelectedBrandId = useBookingActionsStore(state => state.setSelectedBrandId); // Get action to set brand ID
    const selectedCategoryForCreation = useBookingActionsStore(
        state => state.selectedCategoryForCreation,
    ); // Get selected category for creation
    const setSelectedCategoryForCreation = useBookingActionsStore(
        state => state.setSelectedCategoryForCreation,
    ); // Get action to set category for creation

    const setFilterCriteria = useZonesStore(state => state.setFilterCriteria);
    const fetchZones = useZonesStore(state => state.fetchZones);
    const fetchFilterOptions = useZonesStore(state => state.fetchFilterOptions);
    const totalCount = useZonesStore(state => state.totalCount);
    // const filterCriteriaCategory = useZonesStore(state => state.filterCriteria.category); // We'll use selectedCategoryForCreation for the dropdown now
    const paginationCriteria = useZonesStore(state => state.paginationCriteria);
    const setPaginationCriteria = useZonesStore(state => state.setPaginationCriteria);
    const isLoading = useZonesStore(state => state.isLoading); // Get loading state

    // This callback was for filtering zones based on category selection.
    // We still need this filtering behavior, but the CategorySelection component
    // will now directly update the bookingActionsStore state.
    // We need to trigger zone filtering when the category for creation changes.
    const selectedCategoryForCreationFromStore = useBookingActionsStore(
        state => state.selectedCategoryForCreation,
    );
    useEffect(() => {
        // Look up the category name using the code stored in the state
        const categoryName = selectedCategoryForCreationFromStore
            ? KM_CATEGORY_MAP[selectedCategoryForCreationFromStore]
            : undefined;
        // Set the filter criteria using the category name
        setFilterCriteria({ category: categoryName });
    }, [selectedCategoryForCreationFromStore, setFilterCriteria]);

    useEffect(() => {
        if (isAuthenticated) {
            // Fetch initial filter options once after authentication
            fetchFilterOptions();
        }
    }, [fetchFilterOptions, isAuthenticated]); // Fetch options only when auth changes

    useEffect(() => {
        if (isAuthenticated) {
            // Fetch zones whenever filters or pagination change
            fetchZones();
        }
        // Add filterCriteria and paginationCriteria to dependencies
    }, [fetchZones, isAuthenticated, paginationCriteria]);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'SUPPLIER' && user.inn) {
            setSelectedSupplierInnForCreation(user.inn);
        }
        // Depend on specific user properties instead of the whole object
    }, [isAuthenticated, user?.role, user?.inn, setSelectedSupplierInnForCreation]);

    // Effect to automatically set category for Category Managers
    useEffect(() => {
        if (isAuthenticated && user?.role === 'CATEGORY_MANAGER' && user.category) {
            console.log(
                `[CreateBookingPage] Setting category for KM ${user.id} to: ${user.category}`,
            );
            setSelectedCategoryForCreation(user.category);
        }
        // Reset category if user is not KM or doesn't have one? Consider implications.
        // For now, only set it if they are KM and have a category.
    }, [isAuthenticated, user, setSelectedCategoryForCreation]); // Rerun if user object changes

    const filtersAndContent = (
        <div>
            <BookingFilters />
            <ZonesTable />
            <ZonePagination
                currentPage={paginationCriteria.currentPage}
                itemsPerPage={paginationCriteria.itemsPerPage}
                totalCount={totalCount}
                isLoading={isLoading}
                onPageChange={page => setPaginationCriteria({ currentPage: page })}
                onItemsPerPageChange={size =>
                    setPaginationCriteria({ itemsPerPage: size, currentPage: 1 })
                } // Reset to page 1 on size change
            />
        </div>
    );

    // Effect for redirecting unauthenticated users
    useEffect(() => {
        // Only run the effect on the client-side after mount
        if (typeof window !== 'undefined' && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    // Render loading state or null while checking authentication
    if (!isAuthenticated) {
        return <div>Загрузка или перенаправление на страницу входа...</div>; // Or a loading spinner
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <Card className="mb-6 px-6 py-8">
                    <CardTitle className="text-2xl font-bold text-red-600 ">
                        Доступные зоны для бронирования
                    </CardTitle>
                    <p className="text-gray-600 mt-4">
                        Выберите зоны для создания заявки на бронирование.
                    </p>
                    <p className="text-gray-600 mt-4 text-m">
                        Всего доступных зон найдено (с учетом фильтров): {totalCount}{' '}
                    </p>
                </Card>

                <div className="space-y-6">
                    <Card className="mb-6">
                        <CardContent className=" ">
                            {user?.role === 'CATEGORY_MANAGER' && <SupplierSelection />}
                            {/* Only show CategorySelection if user is NOT a Category Manager */}
                            {user?.role !== 'CATEGORY_MANAGER' && (
                                <CategorySelection
                                    // Pass the action from bookingActionsStore
                                    onCategorySelect={setSelectedCategoryForCreation}
                                    // Pass the state from bookingActionsStore
                                    selectedCategory={selectedCategoryForCreation || ''}
                                />
                            )}

                            {/* Brand selector logic based on role */}
                            {/* Show for KM only if their category is set */}
                            {/* Show always for Supplier */}
                            {(user?.role === 'SUPPLIER' ||
                                (user?.role === 'CATEGORY_MANAGER' &&
                                    selectedCategoryForCreation)) && (
                                <div>
                                    <BrandSelector
                                        value={selectedBrandId}
                                        onChange={setSelectedBrandId}
                                        // Disable based on category for KM, always enabled for Supplier
                                        disabled={
                                            user?.role === 'CATEGORY_MANAGER' &&
                                            !selectedCategoryForCreation
                                        }
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    {/* Render content only if a Brand is selected */}
                    {/* For KM, category is auto-set, so brand is the main gate */}
                    {/* For Supplier, brand is the main gate */}
                    {selectedBrandId && filtersAndContent}
                </div>
            </main>
        </div>
    );
}
