'use client';

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useBookingActionsStore } from '@/lib/stores/bookingActionsStore';
import { useZonesStore } from '@/lib/stores/zonesStore';
import { ZonePagination } from '@/app/components/zones/ZonePagination';
import CategorySelection from './booking/CategorySelection';
import { BrandSelector } from './booking/BrandSelector'; // Import BrandSelector
import BookingFilters from './booking/BookingFilters';
import ZonesTable from './booking/ZonesTable';
import BookingPageHeader from './booking/BookingPageHeader';
import SupplierSelection from './booking/SupplierSelection';
import { Card, CardContent } from '@/components/ui/card';
import CreateBookingActions from './booking/CreateBookingActions';

export default function CreateBookingPage() {
    const { isAuthenticated, user } = useAuth();

    const setSelectedSupplierInnForCreation = useBookingActionsStore(
        state => state.setSelectedSupplierInnForCreation,
    );
    const selectedBrandId = useBookingActionsStore(state => state.selectedBrandId); // Get selected brand ID
    const setSelectedBrandId = useBookingActionsStore(state => state.setSelectedBrandId); // Get action to set brand ID

    // Select specific state and actions from zones store
    const setFilterCriteria = useZonesStore(state => state.setFilterCriteria);
    const fetchZones = useZonesStore(state => state.fetchZones);
    const filterCriteriaCategory = useZonesStore(state => state.filterCriteria.category); // Select category specifically
    const fetchFilterOptions = useZonesStore(state => state.fetchFilterOptions);

    const setSelectedCategoryCallback = useCallback(
        (category: string) => {
            setFilterCriteria({ category: category || undefined });
        },
        [setFilterCriteria],
    );

    // Fetch initial zones and filter options on mount
    useEffect(() => {
        if (isAuthenticated) {
            // These actions now trigger the global loader via withLoading in the store
            fetchZones(); // Temporarily commented out for debugging
            fetchFilterOptions(); // Temporarily commented out for debugging
        }
    }, [isAuthenticated, fetchZones, fetchFilterOptions]);

    // Add effect to log category changes
    useEffect(() => {
        console.log(
            'Filter criteria category changed in CreateBookingPage:',
            filterCriteriaCategory, // Use specifically selected category
        );
    }, [filterCriteriaCategory]); // Depend on the specifically selected category

    useEffect(() => {
        if (isAuthenticated && user?.role === 'SUPPLIER' && user.inn) {
            setSelectedSupplierInnForCreation(user.inn);
        }
    }, [isAuthenticated, user, setSelectedSupplierInnForCreation]);

    const filtersAndContent = (
        <div>
            <CreateBookingActions />
            {/* BookingFilters gets isLoading from loader store directly */}
            <BookingFilters />
            <Card className="py-4 mb-6"></Card>
            {/* ZonesTable no longer needs isLoading prop */}
            <ZonesTable />
            <ZonePagination />
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <BookingPageHeader />

                <div className="space-y-6">
                    <Card className="mb-6">
                        <CardContent className=" ">
                            {user?.role === 'CATEGORY_MANAGER' && <SupplierSelection />}
                            <CategorySelection
                                onCategorySelect={setSelectedCategoryCallback}
                                selectedCategory={filterCriteriaCategory || ''} // Use specifically selected category
                            />

                            {filterCriteriaCategory && ( // Use specifically selected category
                                <BrandSelector
                                    value={selectedBrandId}
                                    onChange={setSelectedBrandId}
                                    disabled={!filterCriteriaCategory} // Use specifically selected category
                                />
                            )}
                        </CardContent>
                    </Card>
                    {/* Render content if category is selected */}
                    {filterCriteriaCategory && filtersAndContent}
                </div>
            </main>
        </div>
    );
}
