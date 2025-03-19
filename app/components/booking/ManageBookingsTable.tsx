import React from 'react';
import { useManageBookingsStore } from '@/lib/stores/manageBookingsStore';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { BookingStatus } from '@prisma/client';
import StatusBadge from '@/app/components/StatusBadge';

const ManageBookingsTable = () => {
    const { user } = useAuth();
    const { filteredBookings, isLoading } = useManageBookingsStore();

    // Function to format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Function to get status label
    const getStatusLabel = (status: BookingStatus) => {
        switch (status) {
            case 'PENDING_KM':
                return 'Ожидает КМ';
            case 'KM_APPROVED':
                return 'Одобрено КМ';
            case 'KM_REJECTED':
                return 'Отклонено КМ';
            case 'DMP_APPROVED':
                return 'Одобрено DMP';
            case 'DMP_REJECTED':
                return 'Отклонено DMP';
            default:
                return status;
        }
    };

    // Function to get status color
    const getStatusColor = (status: BookingStatus) => {
        switch (status) {
            case 'PENDING_KM':
                return 'yellow';
            case 'KM_APPROVED':
                return 'green';
            case 'KM_REJECTED':
                return 'red';
            case 'DMP_APPROVED':
                return 'green';
            case 'DMP_REJECTED':
                return 'red';
            default:
                return 'gray';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Управление бронированиями</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <p>Загрузка бронирований...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="flex justify-center items-center h-40">
                        <p>Нет бронирований, соответствующих выбранным фильтрам</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID бронирования</TableHead>
                                <TableHead>Зона</TableHead>
                                <TableHead>Поставщик</TableHead>
                                <TableHead>Дата создания</TableHead>
                                <TableHead>Статус</TableHead>
                                {/* Only show actions column for appropriate roles */}
                                {(user?.role === 'CATEGORY_MANAGER' ||
                                    user?.role === 'DMP_MANAGER') && (
                                    <TableHead>Действия</TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBookings.map(bookingRequest =>
                                bookingRequest.bookings.map(booking => (
                                    <TableRow key={booking.id}>
                                        <TableCell>{booking.id.substring(0, 8)}...</TableCell>
                                        <TableCell>{booking.zone.uniqueIdentifier}</TableCell>
                                        <TableCell>{bookingRequest.supplierName}</TableCell>
                                        <TableCell>
                                            {formatDate(booking.createdAt.toString())}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={booking.status} />
                                        </TableCell>
                                        {/* Actions column for category managers and DMP managers */}
                                        {(user?.role === 'CATEGORY_MANAGER' ||
                                            user?.role === 'DMP_MANAGER') && (
                                            <TableCell>
                                                {user?.role === 'CATEGORY_MANAGER' &&
                                                    booking.status === 'PENDING_KM' && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="mr-2 bg-green-100 hover:bg-green-200"
                                                                onClick={() => {
                                                                    // Handle approve action
                                                                    console.log(
                                                                        'Approve booking',
                                                                        booking.id,
                                                                    );
                                                                }}
                                                            >
                                                                Одобрить
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="bg-red-100 hover:bg-red-200"
                                                                onClick={() => {
                                                                    // Handle reject action
                                                                    console.log(
                                                                        'Reject booking',
                                                                        booking.id,
                                                                    );
                                                                }}
                                                            >
                                                                Отклонить
                                                            </Button>
                                                        </>
                                                    )}
                                                {user?.role === 'DMP_MANAGER' &&
                                                    booking.status === 'KM_APPROVED' && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="mr-2 bg-green-100 hover:bg-green-200"
                                                                onClick={() => {
                                                                    // Handle approve action
                                                                    console.log(
                                                                        'DMP approve booking',
                                                                        booking.id,
                                                                    );
                                                                }}
                                                            >
                                                                Одобрить
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="bg-red-100 hover:bg-red-200"
                                                                onClick={() => {
                                                                    // Handle reject action
                                                                    console.log(
                                                                        'DMP reject booking',
                                                                        booking.id,
                                                                    );
                                                                }}
                                                            >
                                                                Отклонить
                                                            </Button>
                                                        </>
                                                    )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )),
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default ManageBookingsTable;
