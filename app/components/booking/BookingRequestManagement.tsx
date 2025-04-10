'use client';

import React, { useEffect, useState } from 'react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components
import { RefreshCw, Download, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { ZonePagination } from '@/app/components/zones/ZonePagination'; // Import reusable pagination
import { useRouter } from 'next/navigation'; // Correct import for App Router
import { stringify } from 'qs'; // For building query strings

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
        newCount, // Get newCount from store
        setPage,
        setPageSize, // Get setPageSize action
        // Get current filters
        filterCriteria,
    } = useBookingRequestStore();

    const {
        updateBookingStatus, // Action remains the same name
        updateStatusError, // Error specifically from update actions
    } = useBookingActionsStore();

    const { toast } = useToast(); // Initialize toast
    const { user } = useAuth();
    const router = useRouter(); // Initialize the router hook

    // Lifted state for expanded rows
    const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});

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
            // Fetch only if supplier filter is set initially
            console.log('Effect running (supplier), calling fetchBookingRequests. User:', user);
            fetchBookingRequests();
        } else if (user && role !== 'SUPPLIER') {
            // Fetch for non-suppliers on initial load or role change
            console.log('Effect running (non-supplier), calling fetchBookingRequests. User:', user);
            fetchBookingRequests();
        }
        // Removed the .then() block for setting expanded state here
    }, [fetchBookingRequests, user, setFilterCriteria, role]); // Dependencies for triggering initial fetch/filter set

    // Effect to manage expanded state based on bookingRequests data
    useEffect(() => {
        console.log(
            'Effect running to update expanded state. bookingRequests count:',
            bookingRequests.length,
        );
        setExpandedRequests(prevExpanded => {
            const newExpanded: Record<string, boolean> = { ...prevExpanded }; // Start with previous state
            bookingRequests.forEach(req => {
                // If a request ID is new (not in prevExpanded), default it to expanded (true)
                if (!(req.id in prevExpanded)) {
                    newExpanded[req.id] = true;
                }
                // Existing request IDs retain their current expanded/collapsed state from prevExpanded
            });
            // Optional: Clean up IDs that are no longer in bookingRequests
            // This prevents the expanded state from growing indefinitely if requests are removed.
            Object.keys(newExpanded).forEach(id => {
                if (!bookingRequests.some(req => req.id === id)) {
                    delete newExpanded[id];
                }
            });
            return newExpanded;
        });
    }, [bookingRequests]); // Run whenever bookingRequests data changes
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

    // Handler for exporting bookings
    const handleExportBookings = () => {
        // Construct query parameters from filterCriteria
        // Use 'qs' library for robust query string generation, especially for arrays
        const queryParams = stringify(filterCriteria, {
            arrayFormat: 'repeat', // Use repeat format (e.g., status=PENDING&status=APPROVED)
            skipNulls: true, // Don't include null/undefined values
            filter: (prefix: string, value: unknown) => {
                // Use unknown instead of any
                // Ensure empty arrays are skipped as well
                if (Array.isArray(value) && value.length === 0) {
                    return; // Returning undefined skips the key
                }
                // Ensure empty strings are skipped
                if (typeof value === 'string' && value.trim() === '') {
                    return; // Returning undefined skips the key
                }
                return value; // Return the value to include it
            },
        });

        const exportUrl = `/api/bookings/export?${queryParams}`;
        console.log('Export URL:', exportUrl);

        // Open the URL in a new tab to trigger download
        window.open(exportUrl, '_blank');
    };

    // Lifted handlers for expansion
    const toggleExpand = (requestId: string) => {
        setExpandedRequests(prev => ({
            ...prev,
            [requestId]: !prev[requestId],
        }));
    };

    const expandAll = () => {
        const newExpandedRequests: Record<string, boolean> = {};
        bookingRequests.forEach(request => {
            // Use bookingRequests from store state
            newExpandedRequests[request.id] = true;
        });
        setExpandedRequests(newExpandedRequests);
    };

    const collapseAll = () => {
        setExpandedRequests({});
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
                        <div className="flex justify-end items-center">
                            {' '}
                            {/* Changed justify-between to justify-end */}
                            <p className="text-gray-600 mt-2 mr-auto">
                                {' '}
                                {/* Added mr-auto to push count to left */}
                                Всего заявок:{' '}
                                <span className="font-semibold">
                                    {totalCount} {/* Display total count from server */}
                                </span>{' '}
                                (Новых: <span className="font-semibold">{newCount}</span>)
                            </p>
                            <Button
                                onClick={handleRefreshBookings}
                                className="whitespace-nowrap bg-red-600 hover:bg-red-700"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Обновить
                            </Button>
                            {/* Export Button is moved below */}
                        </div>
                        <div></div>
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
                        {' '}
                        {/* Title only in the header */}
                        <CardTitle className="text-xl font-semibold">
                            Заявки на бронирование
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Container for Action Buttons below header */}
                        <div className="flex justify-end items-center mb-4 space-x-2">
                            <Button
                                variant="outline"
                                onClick={expandAll}
                                size="sm" // Smaller buttons might look better here
                            >
                                <ChevronsUpDown className="mr-2 h-4 w-4" /> {/* Icon for expand */}
                                Раскрыть все
                            </Button>
                            <Button
                                variant="outline"
                                onClick={collapseAll}
                                size="sm"
                            >
                                <ChevronsDownUp className="mr-2 h-4 w-4" />{' '}
                                {/* Icon for collapse */}
                                Скрыть все
                            </Button>
                            {/* Wrap Export button with Tooltip */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={handleExportBookings}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Экспорт в Excel
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Экспорт с учетом текущих фильтров</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <RequestsTable
                            onApprove={handleApprove}
                            onReject={handleReject}
                            bookings={bookingRequests} // Pass current page data
                            // Pass down lifted state and handler
                            expandedRequests={expandedRequests}
                            onToggleExpand={toggleExpand}
                        />
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
