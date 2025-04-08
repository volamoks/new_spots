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

import SupplierSelection from './booking/SupplierSelection';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import router from 'next/router';

export default function CreateBookingPage() {
    const { isAuthenticated, user } = useAuth();

    const setSelectedSupplierInnForCreation = useBookingActionsStore(
        state => state.setSelectedSupplierInnForCreation,
    );
    const selectedBrandId = useBookingActionsStore(state => state.selectedBrandId); // Get selected brand ID
    const setSelectedBrandId = useBookingActionsStore(state => state.setSelectedBrandId); // Get action to set brand ID

    const setFilterCriteria = useZonesStore(state => state.setFilterCriteria);
    const fetchZones = useZonesStore(state => state.fetchZones);
    const fetchFilterOptions = useZonesStore(state => state.fetchFilterOptions);
    const totalCount = useZonesStore(state => state.totalCount);
    const filterCriteriaCategory = useZonesStore(state => state.filterCriteria.category);
    const paginationCriteria = useZonesStore(state => state.paginationCriteria);
    const setPaginationCriteria = useZonesStore(state => state.setPaginationCriteria);
    const isLoading = useZonesStore(state => state.isLoading); // Get loading state

    const setSelectedCategoryCallback = useCallback(
        (category: string) => {
            setFilterCriteria({ category: category || undefined });
        },
        [setFilterCriteria],
    );

    useEffect(() => {
        if (isAuthenticated) {
            fetchZones(); // Temporarily commented out for debugging
            fetchFilterOptions(); // Temporarily commented out for debugging
        }
    }, [fetchFilterOptions, fetchZones, isAuthenticated]); // Removed fetchZones/fetchFilterOptions from deps

    useEffect(() => {
        if (isAuthenticated && user?.role === 'SUPPLIER' && user.inn) {
            setSelectedSupplierInnForCreation(user.inn);
        }
        // Depend on specific user properties instead of the whole object
    }, [isAuthenticated, user?.role, user?.inn, setSelectedSupplierInnForCreation]);

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

    if (!isAuthenticated) {
        router.push('/login');
        return <div>Пожалуйста, войдите в систему.</div>;
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
