'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { ColumnSelector } from './ColumnSelector';
import { Check, X } from 'lucide-react';
import { BookingStatus, RequestStatus } from '@prisma/client';

// Define the Booking type, including related Zone and Request information
export type Booking = {
    id: string;
    bookingRequestId: string;
    zoneId: string;
    status: BookingStatus;
    createdAt: Date;
    updatedAt: Date;
    zone: {
        id: string;
        city: string;
        number: string;
        market: string;
        newFormat: string;
        equipment: string;
        dimensions: string;
        mainMacrozone: string;
        adjacentMacrozone: string;
    };
    bookingRequest: {
        userId: string;
        status: RequestStatus;
        category: string | null;
        createdAt: string;
        user: {
            name: string | null;
        };
    };
};

export type RequestsTableProps = {
    bookings: Booking[];
    requestId?: string;
    onApprove: (bookingId: string) => void;
    onReject?: (bookingId: string) => void;
    role: 'CATEGORY_MANAGER' | 'DMP_MANAGER' | 'SUPPLIER';
    onRequestStatusChange?: (requestId: string, newStatus: string) => void;
};

const allColumns = [
    'ID',
    'Город',
    '№',
    'Маркет',
    'Новый формат',
    'Оборудование',
    'Габариты',
    'Основная Макрозона',
    'Смежная макрозона',
    'Статус',
    'Действия',
];

export function RequestsTable({
    bookings,
    requestId,
    onApprove,
    onReject,
    role,
    onRequestStatusChange,
}: RequestsTableProps) {
    const [expandedRequests, setExpandedRequests] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState(allColumns);

    const toggleExpand = (id: string) => {
        setExpandedRequests(prev =>
            prev.includes(id) ? prev.filter(requestId => requestId !== id) : [...prev, id],
        );
    };

    const handleColumnToggle = (column: string) => {
        setVisibleColumns(prev =>
            prev.includes(column) ? prev.filter(col => col !== column) : [...prev, column],
        );
    };

    // Filter bookings by requestId if provided
    const filteredBookings = requestId
        ? bookings.filter(booking => booking.bookingRequestId === requestId)
        : bookings;

    // Group bookings by request ID
    const groupedBookings = useMemo(() => {
        const grouped: { [requestId: string]: Booking[] } = {};
        filteredBookings.forEach(booking => {
            if (!grouped[booking.bookingRequestId]) {
                grouped[booking.bookingRequestId] = [];
            }
            grouped[booking.bookingRequestId].push(booking);
        });
        return grouped;
    }, [filteredBookings]);

    // Используем ref для отслеживания, какие запросы уже обработаны
    const processedRequestsRef = React.useRef<Set<string>>(new Set());

    useEffect(() => {
        // Iterate over each group of bookings (grouped by request ID)
        Object.entries(groupedBookings).forEach(([reqId, requestBookings]) => {
            // Check if all bookings in this request are reviewed
            const allReviewed = requestBookings.every(
                booking =>
                    booking.status === BookingStatus.KM_APPROVED ||
                    booking.status === BookingStatus.KM_REJECTED,
            );

            // Если все бронирования просмотрены, статус не "CLOSED" и запрос еще не обработан
            if (allReviewed && onRequestStatusChange && !processedRequestsRef.current.has(reqId)) {
                // Добавляем ID запроса в множество обработанных
                processedRequestsRef.current.add(reqId);
                // Обновляем статус
                onRequestStatusChange(reqId, 'CLOSED');
            }
        });
    }, [groupedBookings, onRequestStatusChange]);

    return (
        <div>
            <div className="flex justify-end mb-4">
                <ColumnSelector
                    columns={allColumns}
                    visibleColumns={visibleColumns}
                    onColumnToggle={handleColumnToggle}
                />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID заявки</TableHead>
                        <TableHead>Поставщик</TableHead>
                        <TableHead>Дата создания</TableHead>
                        <TableHead>Статус заявки</TableHead>
                        <TableHead>Действия</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.entries(groupedBookings).map(([reqId, requestBookings]) => {
                        const request = requestBookings[0].bookingRequest;
                        return (
                            <React.Fragment key={reqId}>
                                <TableRow
                                    className="cursor-pointer"
                                    onClick={() => toggleExpand(reqId)}
                                >
                                    <TableCell>{reqId}</TableCell>
                                    <TableCell>{request?.user?.name ?? 'N/A'}</TableCell>
                                    <TableCell>
                                        {new Date(request?.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={request?.status} />
                                    </TableCell>
                                    <TableCell>
                                        {expandedRequests.includes(reqId)
                                            ? 'Скрыть детали'
                                            : 'Показать детали'}
                                    </TableCell>
                                </TableRow>
                                {expandedRequests.includes(reqId) && (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        {visibleColumns.includes('ID') && (
                                                            <TableHead className="bg-gray-100 font-medium">
                                                                ID
                                                            </TableHead>
                                                        )}
                                                        {visibleColumns.includes('Город') && (
                                                            <TableHead className="bg-gray-100 font-medium">
                                                                Город
                                                            </TableHead>
                                                        )}
                                                        {visibleColumns.includes('№') && (
                                                            <TableHead className="bg-gray-100 font-medium">
                                                                №
                                                            </TableHead>
                                                        )}
                                                        {visibleColumns.includes('Маркет') && (
                                                            <TableHead className="bg-gray-100 font-medium">
                                                                Маркет
                                                            </TableHead>
                                                        )}
                                                        {visibleColumns.includes(
                                                            'Новый формат',
                                                        ) && (
                                                            <TableHead className="bg-gray-100 font-medium">
                                                                Новый формат
                                                            </TableHead>
                                                        )}
                                                        {visibleColumns.includes(
                                                            'Оборудование',
                                                        ) && (
                                                            <TableHead className="bg-gray-100 font-medium">
                                                                Оборудование
                                                            </TableHead>
                                                        )}
                                                        {visibleColumns.includes('Габариты') && (
                                                            <TableHead className="bg-gray-100 font-medium">
                                                                Габариты
                                                            </TableHead>
                                                        )}
                                                        {visibleColumns.includes(
                                                            'Основная Макрозона',
                                                        ) && (
                                                            <TableHead className="bg-gray-100 font-medium">
                                                                Основная Макрозона
                                                            </TableHead>
                                                        )}
                                                        {visibleColumns.includes(
                                                            'Смежная макрозона',
                                                        ) && (
                                                            <TableHead className="bg-gray-100 font-medium">
                                                                Смежная макрозона
                                                            </TableHead>
                                                        )}
                                                        {visibleColumns.includes('Статус') && (
                                                            <TableHead className="bg-gray-100 font-medium">
                                                                Статус
                                                            </TableHead>
                                                        )}
                                                        {role !== 'SUPPLIER' &&
                                                            visibleColumns.includes('Действия') && (
                                                                <TableHead className="bg-gray-100 font-medium">
                                                                    Действия
                                                                </TableHead>
                                                            )}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {requestBookings.map(booking => {
                                                        return (
                                                            <TableRow key={booking.id}>
                                                                {visibleColumns.includes('ID') && (
                                                                    <TableCell>
                                                                        {booking.id}
                                                                    </TableCell>
                                                                )}
                                                                {visibleColumns.includes(
                                                                    'Город',
                                                                ) && (
                                                                    <TableCell>
                                                                        {booking.zone?.city ??
                                                                            'N/A'}
                                                                    </TableCell>
                                                                )}
                                                                {visibleColumns.includes('№') && (
                                                                    <TableCell>
                                                                        {booking.zone?.number ??
                                                                            'N/A'}
                                                                    </TableCell>
                                                                )}
                                                                {visibleColumns.includes(
                                                                    'Маркет',
                                                                ) && (
                                                                    <TableCell>
                                                                        {booking.zone?.market ??
                                                                            'N/A'}
                                                                    </TableCell>
                                                                )}
                                                                {visibleColumns.includes(
                                                                    'Новый формат',
                                                                ) && (
                                                                    <TableCell>
                                                                        {booking.zone?.newFormat ??
                                                                            'N/A'}
                                                                    </TableCell>
                                                                )}
                                                                {visibleColumns.includes(
                                                                    'Оборудование',
                                                                ) && (
                                                                    <TableCell>
                                                                        {booking.zone?.equipment ??
                                                                            'N/A'}
                                                                    </TableCell>
                                                                )}
                                                                {visibleColumns.includes(
                                                                    'Габариты',
                                                                ) && (
                                                                    <TableCell>
                                                                        {booking.zone?.dimensions ??
                                                                            'N/A'}
                                                                    </TableCell>
                                                                )}
                                                                {visibleColumns.includes(
                                                                    'Основная Макрозона',
                                                                ) && (
                                                                    <TableCell>
                                                                        {booking.zone
                                                                            ?.mainMacrozone ??
                                                                            'N/A'}
                                                                    </TableCell>
                                                                )}
                                                                {visibleColumns.includes(
                                                                    'Смежная макрозона',
                                                                ) && (
                                                                    <TableCell>
                                                                        {booking.zone
                                                                            ?.adjacentMacrozone ??
                                                                            'N/A'}
                                                                    </TableCell>
                                                                )}
                                                                {visibleColumns.includes(
                                                                    'Статус',
                                                                ) && (
                                                                    <TableCell>
                                                                        <StatusBadge
                                                                            status={booking.status}
                                                                        />
                                                                    </TableCell>
                                                                )}
                                                                {role !== 'SUPPLIER' &&
                                                                    visibleColumns.includes(
                                                                        'Действия',
                                                                    ) && (
                                                                        <TableCell>
                                                                            {role ===
                                                                                'CATEGORY_MANAGER' &&
                                                                            booking.status ===
                                                                                BookingStatus.PENDING_KM ? (
                                                                                <div className="flex space-x-2">
                                                                                    <Button
                                                                                        onClick={e => {
                                                                                            e.stopPropagation();
                                                                                            void onApprove(
                                                                                                booking.id,
                                                                                            );
                                                                                        }}
                                                                                        size="sm"
                                                                                        className="bg-green-500 hover:bg-green-600"
                                                                                    >
                                                                                        <Check className="w-4 h-4" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        onClick={e => {
                                                                                            e.stopPropagation();
                                                                                            void (
                                                                                                onReject &&
                                                                                                onReject(
                                                                                                    booking.id,
                                                                                                )
                                                                                            );
                                                                                        }}
                                                                                        size="sm"
                                                                                        variant="destructive"
                                                                                    >
                                                                                        <X className="w-4 h-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            ) : role ===
                                                                                  'DMP_MANAGER' &&
                                                                              booking.status ===
                                                                                  BookingStatus.KM_APPROVED ? (
                                                                                <div className="flex space-x-2">
                                                                                    <Button
                                                                                        onClick={e => {
                                                                                            e.stopPropagation();
                                                                                            void onApprove(
                                                                                                booking.id,
                                                                                            );
                                                                                        }}
                                                                                        size="sm"
                                                                                        className="bg-green-500 hover:bg-green-600"
                                                                                    >
                                                                                        <Check className="w-4 h-4" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        onClick={e => {
                                                                                            e.stopPropagation();
                                                                                            void (
                                                                                                onReject &&
                                                                                                onReject(
                                                                                                    booking.id,
                                                                                                )
                                                                                            );
                                                                                        }}
                                                                                        size="sm"
                                                                                        variant="destructive"
                                                                                    >
                                                                                        <X className="w-4 h-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            ) : null}
                                                                        </TableCell>
                                                                    )}
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
