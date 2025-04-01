'use client';

import { useEffect, useCallback } from 'react'; // Removed useState
import { useAuth } from '@/lib/hooks/useAuth';
import { useBookingActionsStore } from '@/lib/stores/bookingActionsStore'; // Correct store
import { useZonesStore } from '@/lib/stores/zonesStore'; // Correct store, removed FilterCriteria
import { ZonePagination } from '@/app/components/zones/ZonePagination';
import CategorySelection from './booking/CategorySelection';
import BookingFilters from './booking/BookingFilters'; // Assuming this uses useZonesStore now
import ZonesTable from './booking/ZonesTable'; // Assuming this uses useZonesStore now
import BookingPageHeader from './booking/BookingPageHeader';
import SupplierSelection from './booking/SupplierSelection'; // Assuming this uses useBookingActionsStore now
import { Card, CardContent } from '@/components/ui/card';
import CreateBookingActions from './booking/CreateBookingActions'; // Assuming this uses useBookingActionsStore now

export default function CreateBookingPage() {
    const { isAuthenticated, user } = useAuth();
    // Get action from booking actions store
    const setSelectedSupplierInnForCreation = useBookingActionsStore(
        state => state.setSelectedSupplierInnForCreation,
    );

    // Get state and actions from zones store
    const {
        zones, // Current page zones
        totalCount,
        paginationCriteria,
        setPaginationCriteria,
        setFilterCriteria,
        fetchZones,
        // Get filter criteria to read selected category
        filterCriteria,
    } = useZonesStore();

    // Local state might still be needed if CategorySelection doesn't use store directly
    // const [selectedCategory, setSelectedCategory] = useState<string>('');

    // Callback to set category filter in the zones store
    const setSelectedCategoryCallback = useCallback(
        (category: string) => {
            // Set category filter in the store, which triggers fetchZones
            setFilterCriteria({ category: category || undefined });
        },
        [setFilterCriteria],
    );

    // Fetch initial zones and filter options on mount
    useEffect(() => {
        if (isAuthenticated) {
            // fetchZones now takes no arguments
            fetchZones();
            // Fetch filter options if not already fetched elsewhere
            // useZonesStore.getState().fetchFilterOptions(); // Consider where to best call this
        }
    }, [isAuthenticated, fetchZones]);

    // Effect to auto-select supplier for SUPPLIER role
    useEffect(() => {
        if (isAuthenticated && user?.role === 'SUPPLIER' && user.inn) {
            // Use the correct action name
            setSelectedSupplierInnForCreation(user.inn);
        }
        // Ensure dependency array includes the correct action name
    }, [isAuthenticated, user, setSelectedSupplierInnForCreation]);

    // Calculate total pages for pagination
    const totalPages = Math.ceil(totalCount / paginationCriteria.itemsPerPage);

    // Handler for pagination changes
    const handlePageChange = (newPage: number) => {
        setPaginationCriteria({ currentPage: newPage });
    };

    // Handler for items per page change (if needed by ZonePagination)
    const handleItemsPerPageChange = (newSize: number) => {
        setPaginationCriteria({ itemsPerPage: newSize, currentPage: 1 }); // Reset to page 1
    };

    // Inline styles for brevity
    const filtersAndContent = (
        <div>
            {/* Pass necessary props if CreateBookingActions uses store */}
            <CreateBookingActions />
            {/* Pass necessary props if BookingFilters uses store */}
            <BookingFilters />
            <Card className="py-4 mb-6"></Card>
            {/* Pass current page zones */}
            <ZonesTable zones={zones} />
            {/* Pass pagination state and handlers */}
            <ZonePagination
                currentPage={paginationCriteria.currentPage}
                totalItems={totalCount} // Use totalCount from store
                filteredItems={totalCount} // Pass totalCount as filteredItems
                totalPages={totalPages}
                itemsPerPage={paginationCriteria.itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange} // Pass handler if component supports it
            />
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <BookingPageHeader />

                <div className="space-y-6">
                    <Card className="mb-6">
                        <CardContent className=" ">
                            {/* Pass necessary props if SupplierSelection uses store */}
                            {user?.role === 'CATEGORY_MANAGER' && <SupplierSelection />}
                            <CategorySelection
                                onCategorySelect={setSelectedCategoryCallback}
                                // Read selected category from store's filterCriteria
                                selectedCategory={filterCriteria.category || ''}
                            />
                        </CardContent>
                    </Card>

                    {/* Render content if category is selected */}
                    {filterCriteria.category && filtersAndContent}
                </div>
            </main>
        </div>
    );
}
