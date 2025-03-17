'use client';

import { useState } from 'react';
import { ColumnSelector } from './ColumnSelector';
import { useBookingStore } from '@/lib/stores/bookingStore';
import { BookingTable } from './booking/BookingTable';

type RequestsTableProps = {
    onApprove: (requestId: string, zoneId: string) => void;
    onReject?: (requestId: string, zoneId: string) => void;
    role: 'КМ' | 'ДМП' | 'Поставщик';
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

export function RequestsTable({ onApprove, onReject, role }: RequestsTableProps) {
    const { filteredBookings } = useBookingStore();
    const [visibleColumns, setVisibleColumns] = useState(allColumns);

    // We no longer need to fetch bookings here since BookingRequestManagement already does it


    const handleColumnToggle = (column: string) => {
        setVisibleColumns((prev) =>
            prev.includes(column) ? prev.filter((col) => col !== column) : [...prev, column]
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
                role={role}
                onApprove={onApprove}
                onReject={onReject}
            />
        </div>
    );
}
