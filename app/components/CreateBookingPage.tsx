'use client';

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useBookingStore } from '@/lib/stores/bookingStore';
import { useBookingZonesStore } from '@/lib/stores/bookingZonesStore';
import { ZonePagination } from '@/app/components/zones/ZonePagination';
import CategorySelection from './booking/CategorySelection';
import BookingFilters from './booking/BookingFilters';
import ZonesTable from './booking/ZonesTable';
import BookingPageHeader from './booking/BookingPageHeader';
import SupplierSelection from './booking/SupplierSelection';
import { Card, CardContent } from '@/components/ui/card';
import CreateBookingActions from './booking/CreateBookingActions';

export default function CreateBookingPage() {
    const { isAuthenticated, user } = useAuth();
    const setSelectedSupplierInn = useBookingStore(state => state.setSelectedSupplierInn);

    const {
        fetchZones,
        paginatedZones,
        filteredZones,
        zones,
        categoryFilter,
        setCategoryFilter,
        currentPage,
        itemsPerPage,
        setCurrentPage,
        setItemsPerPage,
    } = useBookingZonesStore();

    const setSelectedCategoryCallback = useCallback(
        (category: string) => {
            setCategoryFilter(category);
            // Fetch zones when category is selected
            if (category) {
                fetchZones(
                    user?.role === 'CATEGORY_MANAGER' ? 'CATEGORY_MANAGER' : 'SUPPLIER',
                    category,
                );
            }
        },
        [fetchZones, setCategoryFilter, user?.role],
    );

    useEffect(() => {
        if (isAuthenticated) {
            // Initial fetch of zones without category filter
            fetchZones(user?.role === 'CATEGORY_MANAGER' ? 'CATEGORY_MANAGER' : 'SUPPLIER');
        }
    }, [isAuthenticated, fetchZones, user?.role]);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'SUPPLIER') {
            // Automatically set supplier from session for Suppliers
            setSelectedSupplierInn(user.inn);
        }
    }, [isAuthenticated, user, setSelectedSupplierInn]);

    // Inline styles for brevity
    const filtersAndContent = (
        <div>
            <CreateBookingActions />
            <BookingFilters />
            <Card className="py-4 mb-6"></Card>
            <ZonesTable zones={paginatedZones} />
            <ZonePagination
                currentPage={currentPage}
                totalItems={zones.length}
                filteredItems={filteredZones.length}
                totalPages={Math.ceil(filteredZones.length / itemsPerPage)}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
            />
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <BookingPageHeader />

                <div className="space-y-6">
                    {/* Category Selection at the top */}
                    <Card className="mb-6">
                        {/* Supplier Selection for Category Managers */}
                        <CardContent className=" ">
                            {user?.role === 'CATEGORY_MANAGER' && <SupplierSelection />}
                            <CategorySelection
                                onCategorySelect={setSelectedCategoryCallback}
                                selectedCategory={categoryFilter || ''}
                            />
                        </CardContent>
                    </Card>

                    {categoryFilter && categoryFilter.length > 0 && filtersAndContent}
                </div>
            </main>
        </div>
    );
}
