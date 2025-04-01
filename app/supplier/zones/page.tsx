'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
// Use the base zones store
import { useZonesStore } from '@/lib/stores/zonesStore'; // Removed unused FilterCriteria import
// Keep local state for selection or import a dedicated booking store if needed
// import { useBookingActionsStore } from '@/lib/stores/bookingActionsStore';
import { ZonesSummaryCard } from '@/app/components/zones/ZonesSummaryCard';
import { ZonesFilters } from '@/app/components/zones/ZonesFilters';
import { ZonesTable } from '@/app/components/zones/ZonesTable';
import { useToast } from '@/components/ui/use-toast'; // Import useToast

export default function SupplierZonesPage() {
    const { data: session } = useSession();
    const { toast } = useToast(); // Initialize toast

    // Local state for zone selection for booking
    const [selectedZones, setSelectedZones] = useState<string[]>([]);

    // --- Get state and actions from the refactored zones store ---
    const {
        zones, // Current page zones
        totalCount, // Total filtered count from API
        // isLoading, // Removed - Handled internally by ZonesTable
        error,
        fetchZones,
        fetchFilterOptions, // Added action
        setFilterCriteria, // Action to set filters and trigger refetch
        // Get other necessary state/actions if needed
        // uniqueFilterValues, // Removed - Handled internally by ZonesFilters
    } = useZonesStore();

    // --- Local state/actions for booking (or use bookingActionsStore) ---
    const [isBookingLoading, setIsBookingLoading] = useState(false);

    // Fetch zones when session loads
    useEffect(() => {
        if (session) {
            console.log('Fetching zones for supplier');
            // Set initial filters if needed (e.g., only AVAILABLE status for supplier)
            // setFilterCriteria({ status: ZoneStatus.AVAILABLE } as Partial<FilterCriteria>);
            fetchZones(); // Fetch initial data
            fetchFilterOptions(); // Fetch filter options
        }
    }, [session, fetchZones, fetchFilterOptions, setFilterCriteria]); // Add dependencies

    // handleZoneSelection removed - ZonesTable/Row should use store action or local state directly

    // Booking creation handler (using local state and direct API call)
    const handleCreateBooking = async () => {
        // Prevent multiple clicks while loading
        if (isBookingLoading || selectedZones.length === 0 || !session?.user) return;

        setIsBookingLoading(true);
        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    zoneIds: selectedZones,
                    userId: session.user.id, // Pass user ID
                    // supplierId might not be needed if API derives it from user role/session
                }),
            });

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => ({ error: 'Failed to create booking request' }));
                throw new Error(errorData.error || 'Failed to create booking request');
            }

            toast({
                title: 'Заявка создана',
                description: `Заявка на бронирование ${selectedZones.length} зон успешно создана.`,
                variant: 'success',
            });
            setSelectedZones([]); // Clear selection on success
            // Optionally refetch zones if status changes immediately
            // fetchZones();
        } catch (error) {
            console.error('Ошибка при создании бронирования:', error);
            toast({
                title: 'Ошибка бронирования',
                description: error instanceof Error ? error.message : 'Не удалось создать заявку.',
                variant: 'destructive',
            });
        } finally {
            setIsBookingLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                {/* Summary Card - Use totalCount from zonesStore */}
                <ZonesSummaryCard
                    totalCount={totalCount} // Total matching zones from API
                    filteredCount={zones.length} // Zones on the current page
                    title="Доступные зоны для бронирования"
                    description="Выберите зоны для создания заявки на бронирование"
                />

                {/* Filters - Should use useZonesStore internally */}
                <ZonesFilters
                    role="SUPPLIER"
                    className="mb-6"
                    // uniqueFilterValues prop removed again - component uses store internally
                    // Remove props related to client-side filtering state/handlers
                />

                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded">
                        Ошибка загрузки данных: {error}
                    </div>
                )}

                {/* Table - Gets data from useZonesStore */}
                <ZonesTable
                    // Props related to data/filtering/sorting/pagination are removed
                    // onZoneSelect prop removed - handled internally by ZonesTable/Row via store or local state
                    onCreateBooking={handleCreateBooking} // Pass local booking handler
                    // selectedZones prop removed - handled internally by ZonesTable/Row via store
                    showActions={false} // Suppliers likely don't change status here
                    // isLoading prop removed - handled internally by ZonesTable via store
                    role="SUPPLIER"
                />
            </main>
        </div>
    );
}
