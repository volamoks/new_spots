'use client';

import { BookingActions } from './BookingActions';
import { StatusBadge } from '../StatusBadge';
import { BookingRequestWithBookings } from '@/lib/stores/manageBookingsStore';
import { TableCell } from '@/components/ui/table';
import BookingRole from '@/lib/enums/BookingRole';

type BookingActionsAndStatusProps = {
    booking: BookingRequestWithBookings['bookings'][0];
    userRole: BookingRole;
    requestId: string;
    onApprove: (bookingId: string, zoneId: string) => void;
    onReject?: (requestId: string, bookingId: string, zoneId: string) => void;
};

export function BookingActionsAndStatus({
    booking,
    userRole,
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
                    userRole={userRole}
                    requestId={requestId}
                    onApprove={onApprove}
                    onReject={onReject}
                />
            </TableCell>
        </>
    );
}
