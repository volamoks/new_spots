'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useZonesStore } from '@/lib/stores/zonesStore';
import { useBookingStore } from '@/lib/stores/bookingStore'; // Import useBookingStore
// import MacrozoneSelection from './booking/MacrozoneSelection'; // New component
import CategorySelection from './booking/CategorySelection';
import ManageBookingPageHeader from './booking/ManageBookingPageHeader';
import ManageSupplierSelection from './booking/SupplierSelection';
import { Card, CardContent } from '@/components/ui/card';
// import { GlobalLoader } from './GlobalLoader';

export default function ManageBookingPage() {
    const { isAuthenticated, user } = useAuth();
    const setSelectedSupplierInn = useBookingStore(state => state.setSelectedSupplierInn);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const setSelectedCategoryCallback = useCallback((category: string) => {
        setSelectedCategory(category);
    }, []);

    const { fetchZones } = useZonesStore();

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

    // Inline styles for brevity

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <ManageBookingPageHeader />

                <div className="space-y-6">
                    {/* Category Selection at the top */}
                    <Card className="mb-6">
                        {/* Supplier Selection for Category Managers */}
                        <CardContent className=" ">
                            {user?.role === 'CATEGORY_MANAGER' && <ManageSupplierSelection />}
                            <CategorySelection
                                onCategorySelect={setSelectedCategoryCallback}
                                selectedCategory={selectedCategory}
                            />
                        </CardContent>
                    </Card>
                    {/* Main booking interface */}
                    {/* <MacrozoneSelection selectedCategory={selectedCategory} /> */}
                    {selectedCategory.length > 0 && (
                        <p>Booking management functionality is under development.</p>
                    )}
                </div>
            </main>
        </div>
    );
}
