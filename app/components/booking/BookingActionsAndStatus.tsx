'use client';

import BookingRole from '@/lib/enums/BookingRole';
// Removed incorrect import from '@/types/booking'
// Import the type from the store instead
import { BookingRequestWithBookings } from '@/lib/stores/bookingRequestStore';
import { BookingStatus } from '@prisma/client';
import { StatusBadge } from '../StatusBadge';
import { BookingActions } from './BookingActions';

type BookingActionsAndStatusProps = {
    // Use the correct type for a single booking from the store's definition
    booking: BookingRequestWithBookings['bookings'][number];
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
    // Helper function to determine display status for individual bookings
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

    const displayStatus = getBookingDisplayStatus(booking.status, userRole);

    return (
        <>
            <StatusBadge status={displayStatus} />
            {/* Conditionally render actions cell only if not a supplier */}
            {userRole !== BookingRole.SUPPLIER && (
                <BookingActions
                    booking={booking}
                    userRole={userRole}
                    requestId={requestId}
                    onApprove={onApprove}
                    onReject={onReject}
                />
            )}
        </>
    );
}
