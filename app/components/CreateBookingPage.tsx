'use client';

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useBookingActionsStore } from '@/lib/stores/bookingActionsStore';
import { useZonesStore } from '@/lib/stores/zonesStore';
// Removed unused useLoaderStore import
// import { useLoaderStore } from '@/lib/stores/loaderStore';
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

    // Get state and actions from zones store (excluding isLoading)
    const {
        setFilterCriteria,
        fetchZones,
        filterCriteria,
        fetchFilterOptions,
        // isLoading, // Removed - use global loader store
    } = useZonesStore();

    // Removed unused isLoading from useLoaderStore
    // const isLoading = useLoaderStore(state => state.isLoading);

    // Corrected useCallback syntax
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
            fetchZones();
            fetchFilterOptions();
        }
    }, [isAuthenticated, fetchZones, fetchFilterOptions]);

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
                                selectedCategory={filterCriteria.category || ''}
                            />
                            {/* Add BrandSelector below CategorySelection */}
                            <div className="mt-4">
                                {' '}
                                {/* Add some margin */}
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Выберите Бренд (опционально)
                                </label>
                                <BrandSelector
                                    value={selectedBrandId}
                                    onChange={setSelectedBrandId}
                                    // Disable if no category is selected? Or handle fetch logic inside BrandSelector
                                    disabled={!filterCriteria.category}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Render content if category is selected */}
                    {filterCriteria.category && filtersAndContent}
                </div>
            </main>
        </div>
    );
}
