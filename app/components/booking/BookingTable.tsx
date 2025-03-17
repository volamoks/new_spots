'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '../StatusBadge';
import { BookingRequestWithBookings } from '@/lib/stores/bookingStore';
import { BookingActions } from './BookingActions';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BookingTableProps = {
    requests: BookingRequestWithBookings[];
    visibleColumns?: string[]; // Make optional since we're not using it
    role: 'КМ' | 'ДМП' | 'Поставщик';
    onApprove: (requestId: string, zoneId: string) => void;
    onReject?: (requestId: string, zoneId: string) => void;
};

export function BookingTable({ requests, role, onApprove, onReject }: BookingTableProps) {
    const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});

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

    const toggleExpand = (requestId: string) => {
        setExpandedRequests(prev => ({
            ...prev,
            [requestId]: !prev[requestId],
        }));
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead></TableHead>
                    <TableHead>ID заявки</TableHead>
                    <TableHead>Поставщик</TableHead>
                    <TableHead>Дата создания</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Действия</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests && requests.length > 0 ? (
                    requests.map(request => (
                        <React.Fragment key={`fragment-${request.id}`}>
                            <TableRow className="cursor-pointer hover:bg-gray-50">
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={e => {
                                            e.stopPropagation();
                                            toggleExpand(request.id);
                                        }}
                                    >
                                        {expandedRequests[request.id] ? (
                                            <ChevronUp size={16} />
                                        ) : (
                                            <ChevronDown size={16} />
                                        )}
                                    </Button>
                                </TableCell>
                                <TableCell>{request.id}</TableCell>
                                <TableCell>{request.supplier?.supplierName || 'N/A'}</TableCell>
                                <TableCell>{formatDate(request.createdAt)}</TableCell>
                                <TableCell>
                                    {request.bookings.length > 0 && (
                                        <StatusBadge status={request.bookings[0].status} />
                                    )}
                                </TableCell>
                                <TableCell>
                                    {request.bookings.length > 0 && (
                                        <div className="flex space-x-2">
                                            <BookingActions
                                                booking={request.bookings[0]}
                                                role={role}
                                                requestId={request.id}
                                                onApprove={onApprove}
                                                onReject={onReject}
                                            />
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                            {expandedRequests[request.id] && request.bookings.length > 0 && (
                                <TableRow
                                    key={`${request.id}-details`}
                                    className="bg-gray-50"
                                >
                                    <TableCell colSpan={6}>
                                        <div className="p-4">
                                            <h4 className="font-semibold mb-2">
                                                Детали бронирования
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {request.bookings.map(booking => (
                                                    <div
                                                        key={booking.id}
                                                        className="border p-3 rounded-md"
                                                    >
                                                        <p>
                                                            <span className="font-medium">ID:</span>{' '}
                                                            {booking.id}
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">
                                                                Зона:
                                                            </span>{' '}
                                                            {booking.zone.uniqueIdentifier}
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">
                                                                Город:
                                                            </span>{' '}
                                                            {booking.zone.city}
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">
                                                                Магазин:
                                                            </span>{' '}
                                                            {booking.zone.market}
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">
                                                                Макрозона:
                                                            </span>{' '}
                                                            {booking.zone.mainMacrozone}
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">
                                                                Статус:
                                                            </span>
                                                            <StatusBadge status={booking.status} />
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">
                                                                Дата создания:
                                                            </span>{' '}
                                                            {formatDate(booking.createdAt)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    ))
                ) : (
                    <TableRow>
                        <TableCell
                            colSpan={6}
                            className="text-center py-4"
                        >
                            Нет заявок на бронирование
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
