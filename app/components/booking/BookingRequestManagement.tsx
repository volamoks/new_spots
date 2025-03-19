'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBookingStore } from '@/lib/stores/bookingStore';
import { useBookingToasts } from '@/lib/stores/bookingStore';
import { useManageBookingsStore } from '@/lib/stores/manageBookingsStore';
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
    // Use both stores - bookingStore for CRUD operations and manageBookingsStore for filtering
    const { updateBookingStatus, error, setError } = useBookingStore();

    const { filteredBookings, fetchBookings } = useManageBookingsStore();

    const { showSuccessToast, showErrorToast } = useBookingToasts();
    const { user } = useAuth();
    const role = propRole || user?.role || 'SUPPLIER';
    const { setLoading } = useLoader();

    // Centralized error handling
    useEffect(() => {
        if (error) {
            showErrorToast('Ошибка', error);
            setError(null);
        }
    }, [error, showSuccessToast, showErrorToast, setError]);

    // Load bookings based on role
    useEffect(() => {
        // If user is a supplier, set the supplierInn filter
        if (user && user.role === 'SUPPLIER' && user.inn) {
            // This will automatically filter bookings to show only those for this supplier
            useManageBookingsStore.getState().setFilters({ supplierInn: user.inn });
        }

        // Fetch all bookings without the loading indicator in the useEffect
        fetchBookings();
    }, [fetchBookings, user]);

    // Separate function to handle manual refresh with loading indicator
    const handleRefreshBookings = async () => {
        try {
            setLoading(true, 'Загрузка бронирований...');
            await fetchBookings();
        } catch (error) {
            console.error('Ошибка при загрузке бронирований:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId: string, zoneId: string) => {
        try {
            setLoading(true, 'Одобрение бронирования...');
            if (role === 'CATEGORY_MANAGER') {
                await updateBookingStatus(
                    undefined,
                    requestId,
                    zoneId,
                    'KM_APPROVED' as BookingStatus,
                    BookingRole.KM,
                );
                showSuccessToast('Успешно', 'Бронирование одобрено категорийным менеджером');
            } else if (role === 'DMP_MANAGER') {
                await updateBookingStatus(
                    undefined,
                    requestId,
                    zoneId,
                    'DMP_APPROVED' as BookingStatus,
                    BookingRole.DMP,
                );
                showSuccessToast('Успешно', 'Бронирование одобрено менеджером ДМП');
            }
        } catch {
            showErrorToast('Ошибка', 'Не удалось одобрить бронирование');
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleReject = async (requestId: string, zoneId: string) => {
        try {
            setLoading(true, 'Отклонение бронирования...');
            if (role === 'CATEGORY_MANAGER') {
                await updateBookingStatus(
                    undefined,
                    requestId,
                    zoneId,
                    'KM_REJECTED' as BookingStatus,
                    BookingRole.KM,
                );
                showSuccessToast('Успешно', 'Бронирование отклонено категорийным менеджером');
            } else if (role === 'DMP_MANAGER') {
                // We don't need zoneId for rejection, only for approval
                await updateBookingStatus(
                    undefined,
                    requestId,
                    zoneId,
                    'DMP_REJECTED' as BookingStatus,
                    BookingRole.DMP,
                );
                showSuccessToast('Успешно', 'Бронирование отклонено менеджером ДМП');
            }
        } catch {
            showErrorToast('Ошибка', 'Не удалось отклонить бронирование');
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
                                <span className="font-semibold">{filteredBookings.length}</span>
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
                            bookings={filteredBookings}
                        />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default BookingRequestManagement;
