'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBookingStore } from '@/lib/stores/bookingStore';
import { useBookingToasts } from '@/lib/stores/bookingStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { RequestsTable } from '../RequestsTable';
import { RequestFilters, type RequestFilterState } from '../RequestFilters';

interface BookingRequestManagementProps {
    role?: 'SUPPLIER' | 'CATEGORY_MANAGER' | 'DMP_MANAGER';
}

const BookingRequestManagement: React.FC<BookingRequestManagementProps> = ({
    role: propRole,
}) => {
    const { 
        filteredBookings, 
        fetchBookings, 
        isLoading, 
        approveBooking, 
        rejectBooking,
        dmpApproveBooking,
        dmpRejectBooking,
        error,
        setError,
        applyFilters
    } = useBookingStore();
    
    const { showSuccessToast, showErrorToast } = useBookingToasts();
    const { user } = useAuth();
    const role = propRole || user?.role || 'SUPPLIER';
    
    // State to store filter values
    const [, setFilters] = useState<RequestFilterState>({
        status: [],
        supplierName: "",
        dateFrom: "",
        dateTo: "",
    });

    // Centralized error handling
    useEffect(() => {
        if (error) {
            showErrorToast('Ошибка', error);
            setError(null);
        }
    }, [error, showSuccessToast, showErrorToast, setError]);

    // Load bookings based on role
    useEffect(() => {
        let isMounted = true;
        
        const loadBookings = async () => {
            console.log('Current role:', role);
            console.log('Current user:', user);
            
            // For debugging, let's try to fetch all bookings regardless of status
            // This will help us determine if there are any bookings in the database
            
            // Only update state if component is still mounted
            if (isMounted) {
                try {
                    // Fetch all bookings regardless of status
                    await fetchBookings('');
                    
                    // Log the bookings after they've been fetched
                    const currentBookings = useBookingStore.getState().filteredBookings;
                    console.log('Fetched bookings:', currentBookings);
                    console.log('Fetched bookings length:', currentBookings.length);
                    
                    // Log more details about the bookings
                    if (currentBookings.length > 0) {
                        console.log('First booking request:', currentBookings[0]);
                        if (currentBookings[0].bookings && currentBookings[0].bookings.length > 0) {
                            console.log('First booking in first request:', currentBookings[0].bookings[0]);
                        }
                    } else {
                        console.log('No bookings found. You may need to create some test bookings.');
                    }
                } catch (error) {
                    console.error('Error fetching bookings:', error);
                }
            }
        };
        
        loadBookings();
        
        // Cleanup function to prevent state updates after unmount
        return () => {
            isMounted = false;
        };
    }, [fetchBookings, role, user]); // Remove filteredBookings from the dependency array to avoid infinite loops

    // Use useRef to store the latest filter request
    const activeFilterRequest = React.useRef<AbortController | null>(null);

    const handleFilterChange = async (newFilters: RequestFilterState) => {
        setFilters(newFilters);
        
        // Cancel any previous request
        if (activeFilterRequest.current) {
            activeFilterRequest.current.abort();
        }
        
        // Create a new abort controller for this request
        activeFilterRequest.current = new AbortController();
        
        const statusFilter = newFilters.status.length > 0 
            ? newFilters.status.join(',') 
            : role === 'CATEGORY_MANAGER' 
                ? 'PENDING_KM' 
                : role === 'DMP_MANAGER' 
                    ? 'KM_APPROVED' 
                    : '';
        
        try {
            await fetchBookings(statusFilter);
            applyFilters(newFilters);
        } catch (error) {
            // Ignore aborted requests
            if (error instanceof DOMException && error.name === 'AbortError') {
                console.log('Filter request aborted');
            } else {
                console.error('Error applying filters:', error);
            }
        }
    };

    const handleApprove = async (requestId: string, zoneId: string) => {
        try {
            if (role === 'CATEGORY_MANAGER') {
                await approveBooking(requestId, 'CATEGORY_MANAGER');
                showSuccessToast('Успешно', 'Бронирование одобрено категорийным менеджером');
            } else if (role === 'DMP_MANAGER') {
                await dmpApproveBooking(requestId, zoneId);
                showSuccessToast('Успешно', 'Бронирование одобрено менеджером ДМП');
            }
        } catch {
            showErrorToast('Ошибка', 'Не удалось одобрить бронирование');
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleReject = async (requestId: string, zoneId: string) => {
        try {
            if (role === 'CATEGORY_MANAGER') {
                await rejectBooking(requestId, zoneId, '');
                showSuccessToast('Успешно', 'Бронирование отклонено категорийным менеджером');
            } else if (role === 'DMP_MANAGER') {
                // We don't need zoneId for rejection, only for approval
                await dmpRejectBooking(requestId, zoneId);
                showSuccessToast('Успешно', 'Бронирование отклонено менеджером ДМП');
            }
        } catch {
            showErrorToast('Ошибка', 'Не удалось отклонить бронирование');
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
                        <p className="text-gray-600">
                            {getPageDescription()}
                        </p>
                        <p className="text-gray-600 mt-2">
                            Количество заявок:{' '}
                            <span className="font-semibold">{filteredBookings.length}</span>
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
                        {isLoading ? (
                            <p>Загрузка...</p>
                        ) : (
                            <RequestsTable
                                onApprove={handleApprove}
                                onReject={handleReject}
                                role={getRoleForTable()}
                            />
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default BookingRequestManagement;
