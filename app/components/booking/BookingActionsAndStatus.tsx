'use client';

import { BookingActions } from './BookingActions';
import { StatusBadge } from '../StatusBadge';
import { BookingRequestWithBookings } from '@/lib/stores/bookingStore';
import { TableCell } from '@/components/ui/table';

type BookingActionsAndStatusProps = {
    booking: BookingRequestWithBookings['bookings'][0];
    role: 'КМ' | 'ДМП' | 'Поставщик';
    requestId: string;
    onApprove: (requestId: string, zoneId: string) => void;
    onReject?: (requestId: string, bookingId: string, zoneId: string) => void;
};

export function BookingActionsAndStatus({
    booking,
    role,
    requestId,
    onApprove,
    onReject,
}: BookingActionsAndStatusProps) {
    return (
        <>
            <TableCell>
                <StatusBadge status={booking.status} />
            </TableCell>
            <TableCell>
                <BookingActions
                    booking={booking}
                    role={role}
                    requestId={requestId}
                    onApprove={onApprove}
                    onReject={(requestId, bookingId, zoneId) =>
                        onReject?.(requestId, bookingId, zoneId)
                    }
                />
            </TableCell>
        </>
    );
}
