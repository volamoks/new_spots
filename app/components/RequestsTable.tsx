'use client';

import { useState } from 'react';
import { ColumnSelector } from './ColumnSelector';
import { useBookingRequestStore } from '@/lib/stores/bookingRequestStore'; // Import new store
import { BookingTable } from './booking/BookingTable';
import BookingRole from '@/lib/enums/BookingRole';

// Import type from new store
import { BookingRequestWithBookings } from '@/lib/stores/bookingRequestStore';

type RequestsTableProps = {
    onApprove: (requestId: string, zoneId: string) => void;
    onReject?: (requestId: string, zoneId: string) => void;
    role: 'КМ' | 'ДМП' | 'Поставщик';
    bookings?: BookingRequestWithBookings[]; // Добавляем пропс для передачи бронирований
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
export function RequestsTable({ onApprove, onReject, role, bookings }: RequestsTableProps) {
    // Используем переданные бронирования или получаем их из bookingRequestStore как запасной вариант
    const { filteredBookingRequests: storeBookings } = useBookingRequestStore(); // Use new store and state name
    const [visibleColumns, setVisibleColumns] = useState(allColumns);

    // Используем переданные бронирования, если они есть, иначе используем бронирования из стора
    // Используем переданные бронирования, если они есть, иначе используем бронирования из стора
    const filteredBookings = bookings || storeBookings;

    const userRole =
        role === 'КМ' ? BookingRole.KM : role === 'ДМП' ? BookingRole.DMP : BookingRole.SUPPLIER;

    const handleColumnToggle = (column: string) => {
        setVisibleColumns(prev =>
            prev.includes(column) ? prev.filter(col => col !== column) : [...prev, column],
        );
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <ColumnSelector
                    columns={allColumns}
                    visibleColumns={visibleColumns}
                    onColumnToggle={handleColumnToggle}
                />
            </div>
            <BookingTable
                requests={filteredBookings}
                visibleColumns={visibleColumns}
                userRole={userRole}
                onApprove={onApprove}
                onReject={onReject}
            />
        </div>
    );
}
