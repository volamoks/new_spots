'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useZonesStore } from '@/lib/stores/zonesStore';
import { useFilterStore } from '@/lib/stores/filterStore';
import { useBookingStore } from '@/lib/stores/bookingStore'; // Import useBookingStore
// import MacrozoneSelection from './booking/MacrozoneSelection'; // New component
import { getCorrespondingMacrozones } from '@/lib/filterData';
import { ZonePagination } from '@/app/components/zones/ZonePagination';
import CategorySelection from './booking/CategorySelection';
import BookingFilters from './booking/BookingFilters';
import ZonesTable from './booking/ZonesTable';
import BookingActions from './booking/BookingActions';
import BookingPageHeader from './booking/BookingPageHeader';
import SupplierSelection from './booking/SupplierSelection';
import { Zone } from '@/types/zone';
import { Card, CardContent } from '@/components/ui/card';

export default function BookingPage() {
    const { isAuthenticated, user } = useAuth();
    const setSelectedSupplierInn = useBookingStore(state => state.setSelectedSupplierInn);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const setSelectedCategoryCallback = useCallback((category: string) => {
        setSelectedCategory(category);
    }, []);

    const { zones, fetchZones } = useZonesStore();
    const { applyFilters } = useFilterStore();

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const setCurrentPageCallback = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const setItemsPerPageCallback = useCallback((items: number) => {
        setItemsPerPage(items);
    }, []);

    const userCategory = user?.category || '';
    const correspondingMacrozones = useMemo(
        () => getCorrespondingMacrozones(userCategory),
        [userCategory],
    );

    useEffect(() => {
        if (isAuthenticated) {
            fetchZones(user?.role === 'CATEGORY_MANAGER' ? 'CATEGORY_MANAGER' : 'SUPPLIER');
        }
    }, [isAuthenticated, fetchZones, user?.role]);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'SUPPLIER') {
            // Automatically set supplier from session for Suppliers
            setSelectedSupplierInn(user.inn); // Use INN from session
        }
    }, [isAuthenticated, user, setSelectedSupplierInn]);

    const filteredZones = useMemo(() => {
        return applyFilters(zones);
    }, [zones, applyFilters]);

    const filteredByCategory = useMemo(() => {
        const macrozones = selectedCategory
            ? getCorrespondingMacrozones(selectedCategory)
            : correspondingMacrozones;

        if (!macrozones.length) return filteredZones;

        return filteredZones.filter((zone: Zone) => macrozones.includes(zone.mainMacrozone));
    }, [filteredZones, correspondingMacrozones, selectedCategory]);

    const zonesToDisplay = filteredByCategory;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentZones = useMemo(
        () => zonesToDisplay.slice(startIndex, endIndex),
        [zonesToDisplay, startIndex, endIndex],
    );

    // Inline styles for brevity

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
                                selectedCategory={selectedCategory}
                            />
                        </CardContent>
                    </Card>

                    {/* Main booking interface */}
                    {/* <MacrozoneSelection selectedCategory={selectedCategory} /> */}
                    <BookingFilters selectedCategory={selectedCategory} />
                    <ZonesTable zones={currentZones} />
                    <BookingActions />
                    <ZonePagination
                        currentPage={currentPage}
                        totalItems={zones.length}
                        filteredItems={zonesToDisplay.length}
                        totalPages={Math.ceil(zonesToDisplay.length / itemsPerPage)}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPageCallback}
                        onItemsPerPageChange={setItemsPerPageCallback}
                    />
                </div>
            </main>
        </div>
    );
}
