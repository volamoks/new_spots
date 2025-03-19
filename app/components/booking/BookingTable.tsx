'use client';

import React, { useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '../StatusBadge';
import { BookingRequestWithBookings } from '@/lib/stores/manageBookingsStore';
import { BookingActionsAndStatus } from './BookingActionsAndStatus';
// import { BookingActions } from './BookingActions';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import BookingRole from '@/lib/enums/BookingRole';
// import { BookingStatus } from '@prisma/client';

type BookingTableProps = {
    requests: BookingRequestWithBookings[];
    visibleColumns?: string[]; // Make optional since we're not using it
    userRole: BookingRole;
    onApprove: (requestId: string, zoneId: string) => void;
    onReject?: (requestId: string, zoneId: string) => void;
};

export function BookingTable({ requests, userRole, onApprove, onReject }: BookingTableProps) {
    const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>(
        requests.reduce((acc: Record<string, boolean>, request) => {
            acc[request.id] = true;
            return acc;
        }, {}),
    );

    const toggleExpand = (requestId: string) => {
        setExpandedRequests(prev => ({
            ...prev,
            [requestId]: !prev[requestId],
        }));
    };

    const expandAll = () => {
        const newExpandedRequests: Record<string, boolean> = {};
        requests.forEach(request => {
            newExpandedRequests[request.id] = true;
        });
        setExpandedRequests(newExpandedRequests);
    };

    const collapseAll = () => {
        setExpandedRequests({});
    };

    // Helper function to format date with defensive programming
    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return 'N/A';

        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            return dateObj.toLocaleDateString('ru-RU'); // Adjust locale as needed
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };

    const memoizedOnApprove = useCallback(onApprove, [onApprove]);
    const memoizedOnReject = useCallback(onReject || (() => {}), [onReject]);

    return (
        <>
            <div className="mb-4">
                <Button
                    onClick={expandAll}
                    className="mr-2"
                >
                    Раскрыть все
                </Button>
                <Button onClick={collapseAll}>Скрыть все</Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        {/* <TableHead>ID заявки</TableHead> */}
                        <TableHead>ID бронирования</TableHead>
                        <TableHead>Зона</TableHead>
                        <TableHead>Город</TableHead>
                        <TableHead>Магазин</TableHead>
                        <TableHead>Макрозона</TableHead>
                        <TableHead>Статус</TableHead>
                        {/* <TableHead>Дата создания</TableHead> */}
                        <TableHead>Действия</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests && requests.length > 0 ? (
                        requests.map(request => (
                            <React.Fragment key={request.id}>
                                <TableRow className="bg-gray-100 cursor-pointer">
                                    <TableCell
                                        colSpan={10}
                                        className="font-bold"
                                        onClick={() => toggleExpand(request.id)}
                                    >
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                        >
                                            {expandedRequests[request.id] ? (
                                                <ChevronUp size={16} />
                                            ) : (
                                                <ChevronDown size={16} />
                                            )}
                                        </Button>
                                        Заявка: {request.id} от {request.supplierName} ({' '}
                                        {formatDate(request.createdAt)})
                                        <StatusBadge status={request.status} />
                                    </TableCell>
                                </TableRow>
                                {expandedRequests[request.id] &&
                                    request.bookings.map(booking => (
                                        <TableRow key={booking.id}>
                                            <TableCell>{booking.id}</TableCell>
                                            {/* <TableCell>{request.supplierName || 'N/A'}</TableCell>s */}
                                            <TableCell>{booking.zone.uniqueIdentifier}</TableCell>
                                            <TableCell>{booking.zone.city}</TableCell>
                                            <TableCell>{booking.zone.market}</TableCell>
                                            <TableCell>{booking.zone.mainMacrozone}</TableCell>

                                            <BookingActionsAndStatus
                                                booking={booking}
                                                userRole={userRole}
                                                requestId={request.id}
                                                onApprove={memoizedOnApprove}
                                                onReject={memoizedOnReject}
                                            />
                                        </TableRow>
                                    ))}
                            </React.Fragment>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={9}
                                className="text-center py-4"
                            >
                                Нет заявок на бронирование
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </>
    );
}
