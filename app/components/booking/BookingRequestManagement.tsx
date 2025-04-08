'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    useBookingRequestStore,
    type BookingRequestWithBookings,
} from '@/lib/stores/bookingRequestStore'; // Import type too
import { useBookingActionsStore } from '@/lib/stores/bookingActionsStore';
import { useToast } from '@/components/ui/use-toast'; // Import useToast directly
import { useAuth } from '@/lib/hooks/useAuth';
import { RequestsTable } from '../RequestsTable';
import ManageBookingsFilters from './ManageBookingsFilters';
import { BookingStatus } from '@prisma/client';
import BookingRole from '@/lib/enums/BookingRole';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { ZonePagination } from '@/app/components/zones/ZonePagination'; // Import reusable pagination
import { useRouter } from 'next/navigation'; // Correct import for App Router

const BookingRequestManagement: React.FC = () => {
    // Get state/actions from new stores
    const {
        bookingRequests, // Use the current page data
        fetchBookingRequests,
        setFilterCriteria,
        error: requestError,
        // Pagination state and actions
        page,
        pageSize,
        totalCount,
        setPage,
        setPageSize, // Get setPageSize action
    } = useBookingRequestStore();

    const {
        updateBookingStatus, // Action remains the same name
        updateStatusError, // Error specifically from update actions
    } = useBookingActionsStore();

    const { toast } = useToast(); // Initialize toast
    const { user } = useAuth();
    const router = useRouter(); // Initialize the router hook

    // Effect for redirecting unauthenticated users
    useEffect(() => {
        // Only run the effect on the client-side after mount
        if (typeof window !== 'undefined' && !user) {
            router.push('/login');
        }
    }, [user, router]);

    // Centralized error handling for both stores
    useEffect(() => {
        const combinedError = requestError || updateStatusError;
        if (combinedError) {
            toast({
                title: 'Ошибка',
                description: combinedError,
                variant: 'destructive',
            });
        }
    }, [requestError, updateStatusError, toast]);

    const role = user?.role;

    // Load bookings and set initial filter
    useEffect(() => {
        // If user is a supplier, set the supplierInn filter
        if (user && role === 'SUPPLIER' && user.inn) {
            // Use setFilterCriteria from the new store
            setFilterCriteria({ supplierInn: user.inn || undefined });
        }
        console.log('Effect running, calling fetchBookingRequests. User:', user); // Add log
        // Fetch all bookings using the new action name
        fetchBookingRequests();
    }, [fetchBookingRequests, user, setFilterCriteria, role]); // Add setFilterCriteria dependency

    // Separate function to handle manual refresh
    const handleRefreshBookings = async () => {
        try {
            // setLoading calls removed - handled by fetchBookingRequests internally
            await fetchBookingRequests(page, pageSize); // Refetch current page
        } catch (error) {
            // Error handling is now primarily within the store action,
            // but catch unexpected errors during the call itself.
            console.error('Ошибка при вызове fetchBookingRequests:', error);
            // Optionally show a generic error toast here if needed
            // toast({ title: 'Ошибка', description: 'Не удалось обновить заявки.', variant: 'destructive' });
        }
        // finally block removed
    };

    // Handler for items per page change
    const handleItemsPerPageChange = (size: number) => {
        setPageSize(size);
        setPage(1); // Reset to first page when page size changes
    };

    // Helper to find bookingId
    const findBookingId = (requestId: string, zoneId: string): string | undefined => {
        // Find within the current page's data
        const request = bookingRequests.find(
            (req: BookingRequestWithBookings) => req.id === requestId,
        );
        const booking = request?.bookings.find(b => b.zoneId === zoneId);
        return booking?.id;
    };

    const handleApprove = async (requestId: string, zoneId: string) => {
        console.log(
            `handleApprove callback executed for requestId: ${requestId}, zoneId: ${zoneId}. No further action taken here.`,
        );
    };

    const handleReject = async (requestId: string, zoneId: string) => {
        const bookingId = findBookingId(requestId, zoneId);
        if (!bookingId) {
            toast({
                title: 'Ошибка',
                description: 'Не удалось найти ID бронирования.',
                variant: 'destructive',
            });
            return;
        }

        // setLoading call removed - handled by updateBookingStatus internally
        let success = false;
        try {
            if (role === 'CATEGORY_MANAGER') {
                success = await updateBookingStatus(
                    bookingId,
                    'KM_REJECTED' as BookingStatus,
                    BookingRole.KM,
                );
                if (success)
                    toast({
                        title: 'Успешно',
                        description: 'Бронирование отклонено категорийным менеджером',
                    });
            } else if (role === 'DMP_MANAGER') {
                success = await updateBookingStatus(
                    bookingId,
                    'DMP_REJECTED' as BookingStatus,
                    BookingRole.DMP,
                );
                if (success)
                    toast({
                        title: 'Успешно',
                        description: 'Бронирование отклонено менеджером ДМП',
                    });
            }
            if (!success) throw new Error('Update action returned false'); // Trigger catch block if update failed
        } catch {
            // Removed unused 'err'
            if (!updateStatusError) {
                // Show generic only if specific error isn't already shown
                toast({
                    title: 'Ошибка',
                    description: 'Не удалось отклонить бронирование',
                    variant: 'destructive',
                });
            }
        }
        // finally block with setLoading removed
    };

    const getPageTitle = () => {
        return 'Управление бронированиями';
    };

    const getPageDescription = 'Просмотр и управление бронированиями';

    // Render loading state or null while checking authentication (AFTER all hooks)
    if (!user) {
        return <div>Загрузка или перенаправление на страницу входа...</div>; // Or a loading spinner
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-corporate">
                            {getPageTitle()}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">{getPageDescription}</p>
                        <div className="flex justify-between items-center">
                            <p className="text-gray-600 mt-2">
                                Количество заявок:{' '}
                                <span className="font-semibold">
                                    {totalCount} {/* Display total count from server */}
                                </span>
                            </p>
                            <Button
                                onClick={handleRefreshBookings}
                                className="whitespace-nowrap bg-red-600 hover:bg-red-700"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Обновить
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">Фильтры</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ManageBookingsFilters />
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
                            onApprove={handleApprove}
                            onReject={handleReject}
                            bookings={bookingRequests} // Pass current page data
                        />

                        <div className="mt-4"> {/* Add some margin */}</div>
                    </CardContent>
                </Card>
                <div className=" mt-4">
                    <ZonePagination
                        currentPage={page}
                        itemsPerPage={pageSize}
                        totalCount={totalCount}
                        onPageChange={setPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                    />
                </div>
            </main>
        </div>
    );
};

export default BookingRequestManagement;
