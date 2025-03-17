'use client';

import { useEffect, useCallback } from 'react';
import { RequestsTable } from '../components/RequestsTable';
import { RequestFilters, type RequestFilterState } from '../components/RequestFilters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useBookingStore, useBookingToasts } from '@/lib/stores/bookingStore';
// import { type Booking, type Zone, type BookingRequest, type User } from '@prisma/client';

export default function CategoryManagerPage() {
    const { data: session } = useSession();
    const {
        filteredBookings,
        fetchBookings,
        approveBooking,
        rejectBooking,
        updateRequestStatus,
        applyFilters,
        error,
        setError,
    } = useBookingStore();

    const { showSuccessToast, showErrorToast } = useBookingToasts();

    // Centralized error handling
    useEffect(() => {
        if (error) {
            showErrorToast('Ошибка', error);
            setError(null);
        }
    }, [error, showErrorToast, setError]);

    useEffect(() => {
        const loadData = async () => {
            if (session) {
                await fetchBookings();
            }
        };

        loadData();
    }, [session, fetchBookings]);

    const handleApprove = useCallback(
        async (bookingId: string) => {
            await approveBooking(bookingId, 'CATEGORY_MANAGER');
        },
        [approveBooking],
    );

    const handleReject = useCallback(
        async (bookingId: string) => {
            await rejectBooking(bookingId, 'CATEGORY_MANAGER');
        },
        [rejectBooking],
    );

    const handleFilterChange = useCallback(
        async (filters: RequestFilterState) => {
            await fetchBookings(filters.status.length > 0 ? filters.status.join(',') : undefined);
            applyFilters(filters);
        },
        [applyFilters, fetchBookings],
    );

    const handleRequestStatusChange = useCallback(
        async (requestId: string) => {
            await updateRequestStatus(requestId);
        },
        [updateRequestStatus],
    );

    const flattenedBookings = filteredBookings.reduce((acc: any[], bookingRequest) => {
        const bookingsWithRelations = bookingRequest.bookings.map((booking: Booking) => ({
            ...booking,
            zone: booking.zone,
            bookingRequest: {
                ...bookingRequest,
                user: bookingRequest.user,
            },
        }));
        return acc.concat(bookingsWithRelations);
    }, []) as any[];

    const filteredSpotsCount = flattenedBookings.length;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-corporate">
                            Панель категорийного менеджера
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">
                            Управляйте заявками на бронирование зон продаж
                        </p>
                        <p className="text-gray-600 mt-2">
                            Количество заявок:{' '}
                            <span className="font-semibold">{filteredSpotsCount}</span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">Фильтры</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RequestFilters onFilterChange={handleFilterChange} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">
                            Заявки на бронирование
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RequestsTable
                            bookings={flattenedBookings}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            role="CATEGORY_MANAGER"
                            onRequestStatusChange={handleRequestStatusChange}
                        />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
