'use client';

import React, { useCallback } from 'react';
import { cn } from '@/lib/utils'; // Import cn utility
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '../StatusBadge';
// Import the type from the new store
import { BookingRequestWithBookings } from '@/lib/stores/bookingRequestStore';
// import { BookingActionsAndStatus } from './BookingActionsAndStatus'; // Removed unused import
import { BookingActions } from './BookingActions'; // Added import
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import BookingRole from '@/lib/enums/BookingRole';
import { BookingStatus, RequestStatus } from '@prisma/client'; // Import necessary statuses

type BookingTableProps = {
    requests: BookingRequestWithBookings[];
    visibleColumns?: string[]; // Make optional since we're not using it
    userRole: BookingRole;
    onApprove: (requestId: string, zoneId: string) => void;
    onReject?: (requestId: string, zoneId: string) => void;
};

// Helper function moved outside the component
// Calculates the display status for an individual booking based on role
const getBookingDisplayStatus = (status: BookingStatus, role: BookingRole): string => {
    if (role === BookingRole.SUPPLIER) {
        switch (status) {
            case BookingStatus.PENDING_KM:
            case BookingStatus.KM_APPROVED:
                return 'BOOKING_IN_PROGRESS'; // "В работе"
            case BookingStatus.DMP_APPROVED:
                return 'BOOKING_APPROVED'; // "Согласовано"
            case BookingStatus.KM_REJECTED:
            case BookingStatus.DMP_REJECTED:
                return 'BOOKING_REJECTED'; // "Отклонено"
            default:
                return 'BOOKING_UNKNOWN'; // Fallback for unexpected statuses
        }
    } else {
        // For KM/DMP, return the original status enum value
        return status;
    }
};

// Helper function to calculate the OVERALL status for the BookingRequest header
// Calculates the OVERALL status for the BookingRequest header
const getRequestDisplayStatus = (
    request: BookingRequestWithBookings,
    // role: BookingRole, // Role no longer needed for header status logic
): string => {
    // Return type is now always a string
    // Handle cases with no bookings gracefully
    if (!request.bookings || request.bookings.length === 0) {
        // If no bookings, maybe default to a 'NEW' or 'EMPTY' status?
        // For now, let's use a specific string.
        return 'REQUEST_EMPTY'; // Need to add this to StatusBadge
    }

    const bookingStatuses = request.bookings.map(b => b.status);

    // Define status categories
    const kmProcessedStatuses: BookingStatus[] = [
        BookingStatus.KM_APPROVED,
        BookingStatus.KM_REJECTED,
    ];
    const dmpProcessedStatuses: BookingStatus[] = [
        BookingStatus.DMP_APPROVED,
        BookingStatus.DMP_REJECTED,
    ];
    // A request is fully closed if every booking is either rejected by KM or processed by DMP
    const closedStatuses: BookingStatus[] = [
        BookingStatus.KM_REJECTED, // KM rejection closes the booking
        ...dmpProcessedStatuses, // Any DMP action closes the booking
    ];

    // 1. "Заявка закрыта" (Request Closed)
    // If ALL bookings are in a state considered 'closed'
    if (bookingStatuses.every(s => closedStatuses.includes(s))) {
        return 'REQUEST_CLOSED'; // New status string
    }

    // 2. "Обработано КМ" (Processed by KM)
    // If ALL bookings have been processed by KM (approved or rejected)
    // AND the request is not closed (checked above)
    const allKmProcessed = bookingStatuses.every(s => kmProcessedStatuses.includes(s));
    if (allKmProcessed) {
        return 'REQUEST_PROCESSED_KM'; // New status string
    }

    // 3. "Новая заявка" (New Request)
    // If ANY booking is still PENDING_KM (or potentially the request's initial status is NEW)
    if (
        bookingStatuses.some(s => s === BookingStatus.PENDING_KM) ||
        request.status === RequestStatus.NEW
    ) {
        return 'REQUEST_NEW'; // New status string
    }

    // 4. "В обработке" (Processing) - Default intermediate state
    // If it's not EMPTY, CLOSED, PROCESSED_KM, or NEW, it implies it's in an
    // intermediate state, likely awaiting DMP action on KM_APPROVED bookings.
    return 'REQUEST_PROCESSING'; // New status string

    // Fallback removed as REQUEST_PROCESSING should cover the gap
    // console.warn('Unexpected state in getRequestDisplayStatus for request:', request.id);
    // return 'REQUEST_UNKNOWN';
};
// End of getRequestDisplayStatus function definition

export function BookingTable({ requests, userRole, onApprove, onReject }: BookingTableProps) {
    const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>(() => {
        const expanded: Record<string, boolean> = {};
        requests.forEach(request => {
            expanded[request.id] = true;
        });
        return expanded;
    });

    // Update expanded state when requests change to ensure new requests are expanded by default
    React.useEffect(() => {
        setExpandedRequests(prev => {
            const newExpanded = { ...prev };
            requests.forEach(request => {
                // Only set to true if it doesn't exist or was previously true
                if (!(request.id in prev)) {
                    newExpanded[request.id] = true;
                }
            });
            return newExpanded;
        });
    }, [requests]);

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
                    variant="outline"
                    onClick={expandAll}
                    className="mr-2"
                >
                    Раскрыть все
                </Button>
                <Button
                    variant="outline"
                    onClick={collapseAll}
                >
                    Скрыть все
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID бронирования</TableHead>
                        <TableHead>Зона</TableHead>
                        <TableHead>Город</TableHead>
                        <TableHead>Магазин</TableHead>
                        <TableHead>Макрозона</TableHead>
                        <TableHead>Бренд</TableHead>
                        {/* Add Brand Header */}
                        <TableHead>Статус</TableHead>
                        {userRole !== BookingRole.SUPPLIER && <TableHead>Действия</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests && requests.length > 0 ? (
                        requests.map(request => {
                            const displayStatus = getRequestDisplayStatus(request); // Role no longer needed here
                            const isClosed = displayStatus === RequestStatus.CLOSED;

                            return (
                                <React.Fragment key={request.id}>
                                    <TableRow
                                        className={cn(
                                            'bg-gray-100 cursor-pointer',
                                            isClosed && 'opacity-60 bg-gray-200', // Apply gray out style if closed
                                        )}
                                    >
                                        <TableCell
                                            colSpan={11} // Corrected colspan
                                            className="font-bold"
                                            onClick={() => toggleExpand(request.id)}
                                        >
                                            <div className="flex">
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
                                                <div>
                                                    <div className="flex justify-self-auto">
                                                        <label className="text-sm font-bold mb-1 block text-gray-700">
                                                            Заявка N: {request.id.slice(-4)} от{' '}
                                                            {formatDate(request.createdAt)}
                                                        </label>{' '}
                                                        {/* Use the helper function to determine display status */}
                                                        <StatusBadge status={displayStatus} />
                                                    </div>

                                                    <label className="text-sm font-bold mb-1 block text-gray-700">
                                                        {' '}
                                                        Поставщик: {request.supplierName}{' '}
                                                    </label>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {expandedRequests[request.id] &&
                                        request.bookings.map(booking => (
                                            <TableRow key={booking.id}>
                                                <TableCell>{booking.id}</TableCell>
                                                {/* <TableCell>{request.supplierName || 'N/A'}</TableCell>s */}
                                                <TableCell>
                                                    {booking.zone.uniqueIdentifier}
                                                </TableCell>
                                                <TableCell>{booking.zone.city}</TableCell>
                                                <TableCell>{booking.zone.market}</TableCell>
                                                <TableCell>{booking.zone.mainMacrozone}</TableCell>
                                                <TableCell>
                                                    {booking.brand?.name || 'N/A'}
                                                </TableCell>
                                                {/* Wrap StatusBadge and BookingActions in separate TableCells */}
                                                <TableCell>
                                                    <StatusBadge
                                                        status={getBookingDisplayStatus(
                                                            booking.status,
                                                            userRole,
                                                        )}
                                                    />
                                                </TableCell>
                                                {userRole !== BookingRole.SUPPLIER && (
                                                    <TableCell>
                                                        <BookingActions
                                                            booking={booking}
                                                            userRole={userRole}
                                                            requestId={request.id}
                                                            onApprove={memoizedOnApprove}
                                                            onReject={memoizedOnReject}
                                                        />
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                </React.Fragment>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={10} // Corrected colspan
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
