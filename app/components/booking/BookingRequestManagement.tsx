'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBookingRequestStore } from '@/lib/stores/bookingRequestStore';
import { useBookingActionsStore } from '@/lib/stores/bookingActionsStore';
import { useToast } from '@/components/ui/use-toast'; // Import useToast directly
import { useAuth } from '@/lib/hooks/useAuth';
import { RequestsTable } from '../RequestsTable';
import ManageBookingsFilters from './ManageBookingsFilters';
import { BookingStatus } from '@prisma/client';
import BookingRole from '@/lib/enums/BookingRole';
import { useLoader } from '@/app/components/GlobalLoader';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface BookingRequestManagementProps {
    role?: 'SUPPLIER' | 'CATEGORY_MANAGER' | 'DMP_MANAGER';
}

const BookingRequestManagement: React.FC<BookingRequestManagementProps> = ({ role: propRole }) => {
    // Get state/actions from new stores
    const {
        filteredBookingRequests, // Renamed state
        fetchBookingRequests, // Renamed action
        setFilterCriteria, // New action for filtering
        error: requestError, // Error from fetching requests
    } = useBookingRequestStore();

    const {
        updateBookingStatus, // Action remains the same name
        updateStatusError, // Error specifically from update actions
    } = useBookingActionsStore();

    const { toast } = useToast(); // Initialize toast
    const { user } = useAuth();
    const role = propRole || user?.role || 'SUPPLIER';
    const { setLoading } = useLoader(); // Keep using global loader

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

    // Load bookings and set initial filter
    useEffect(() => {
        // If user is a supplier, set the supplierInn filter
        if (user && user.role === 'SUPPLIER' && user.inn) {
            // Use setFilterCriteria from the new store
            setFilterCriteria({ supplierInn: user.inn });
        }

        // Fetch all bookings using the new action name
        fetchBookingRequests();
    }, [fetchBookingRequests, user, setFilterCriteria]); // Add setFilterCriteria dependency

    // Separate function to handle manual refresh with loading indicator
    const handleRefreshBookings = async () => {
        try {
            setLoading(true, 'Загрузка бронирований...');
            await fetchBookingRequests(); // Use new action name
        } catch (error) {
            // Error handling can be improved, maybe show toast via store error state
            console.error('Ошибка при загрузке бронирований:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to find bookingId
    const findBookingId = (requestId: string, zoneId: string): string | undefined => {
        const request = filteredBookingRequests.find(req => req.id === requestId);
        const booking = request?.bookings.find(b => b.zoneId === zoneId);
        return booking?.id;
    };

    const handleApprove = async (requestId: string, zoneId: string) => {
        const bookingId = findBookingId(requestId, zoneId);
        if (!bookingId) {
            toast({
                title: 'Ошибка',
                description: 'Не удалось найти ID бронирования.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true, 'Одобрение бронирования...');
        let success = false;
        try {
            if (role === 'CATEGORY_MANAGER') {
                success = await updateBookingStatus(
                    bookingId,
                    'KM_APPROVED' as BookingStatus,
                    BookingRole.KM,
                );
                if (success)
                    toast({
                        title: 'Успешно',
                        description: 'Бронирование одобрено категорийным менеджером',
                    });
            } else if (role === 'DMP_MANAGER') {
                success = await updateBookingStatus(
                    bookingId,
                    'DMP_APPROVED' as BookingStatus,
                    BookingRole.DMP,
                );
                if (success)
                    toast({
                        title: 'Успешно',
                        description: 'Бронирование одобрено менеджером ДМП',
                    });
            }
            if (!success) throw new Error('Update action returned false'); // Trigger catch block if update failed
        } catch {
            // Removed unused 'err'
            // Error is already logged/handled by the useEffect hook watching updateStatusError
            // We show a generic message here if needed, or rely on the hook
            if (!updateStatusError) {
                // Show generic only if specific error isn't already shown
                toast({
                    title: 'Ошибка',
                    description: 'Не удалось одобрить бронирование',
                    variant: 'destructive',
                });
            }
        } finally {
            setLoading(false);
        }
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

        setLoading(true, 'Отклонение бронирования...');
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
        } finally {
            setLoading(false);
        }
    };

    const getPageTitle = () => {
        switch (role) {
            case 'CATEGORY_MANAGER':
                return 'Панель категорийного менеджера';
            case 'DMP_MANAGER':
                return 'Панель менеджера ДМП';
            case 'SUPPLIER':
                return 'Мои бронирования';
            default:
                return 'Управление бронированиями';
        }
    };

    const getPageDescription = () => {
        switch (role) {
            case 'CATEGORY_MANAGER':
                return 'Управляйте заявками на бронирование зон продаж';
            case 'DMP_MANAGER':
                return 'Управляйте заявками, согласованными категорийными менеджерами';
            case 'SUPPLIER':
                return 'Просмотр статуса ваших заявок на бронирование';
            default:
                return 'Просмотр и управление бронированиями';
        }
    };

    const getRoleForTable = () => {
        switch (role) {
            case 'CATEGORY_MANAGER':
                return 'КМ';
            case 'DMP_MANAGER':
                return 'ДМП';
            case 'SUPPLIER':
                return 'Поставщик';
            default:
                return 'Поставщик';
        }
    };

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
                        <p className="text-gray-600">{getPageDescription()}</p>
                        <div className="flex justify-between items-center">
                            <p className="text-gray-600 mt-2">
                                Количество заявок:{' '}
                                <span className="font-semibold">
                                    {filteredBookingRequests.length}
                                </span>{' '}
                                {/* Use new state name */}
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
                            role={getRoleForTable()}
                            bookings={filteredBookingRequests} // Use new state name
                        />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default BookingRequestManagement;
