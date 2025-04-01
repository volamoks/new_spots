'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useZonesStore } from '@/lib/stores/zonesStore';
import { useBookingActionsStore } from '@/lib/stores/bookingActionsStore'; // Import correct store
// import MacrozoneSelection from './booking/MacrozoneSelection'; // New component
import CategorySelection from './booking/CategorySelection';
import BookingPageHeader from './booking/BookingPageHeader';
import SupplierSelection from './booking/SupplierSelection';
import { Card, CardContent } from '@/components/ui/card';
// import { GlobalLoader } from './GlobalLoader';

export default function BookingPage() {
    const { isAuthenticated, user } = useAuth();
    // Get action from correct store
    const setSelectedSupplierInnForCreation = useBookingActionsStore(
        state => state.setSelectedSupplierInnForCreation,
    );
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const setSelectedCategoryCallback = useCallback((category: string) => {
        setSelectedCategory(category);
    }, []);

    const { fetchZones } = useZonesStore();

    useEffect(() => {
        if (isAuthenticated) {
            // fetchZones now takes no arguments and uses store criteria
            // We might need to set filter criteria here based on role if needed
            fetchZones();
        }
    }, [isAuthenticated, fetchZones]); // Removed user?.role dependency

    useEffect(() => {
        if (isAuthenticated && user?.role === 'SUPPLIER' && user.inn) {
            // Automatically set supplier from session for Suppliers
            // Use the correct action name
            setSelectedSupplierInnForCreation(user.inn);
        }
        // Ensure dependency array includes the correct action name
    }, [isAuthenticated, user, setSelectedSupplierInnForCreation]);

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
                    {selectedCategory.length > 0}
                </div>
            </main>
        </div>
    );
}
