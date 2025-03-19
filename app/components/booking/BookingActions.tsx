import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useBookingActions } from '@/lib/hooks/useBookingActions';
import { useCallback, MouseEvent } from 'react';
import { BookingStatus } from '@prisma/client';
import BookingRole from '@/lib/enums/BookingRole';
import { BOOKING_ACTIONS_CONFIG } from '@/lib/constants/bookingActions';

type BookingActionsProps = {
    booking: {
        id: string;
        status: BookingStatus;
        zone: {
            id: string;
        };
    };
    userRole: BookingRole;
    requestId: string;
    onApprove: (bookingId: string, zoneId: string) => void;
    onReject?: (requestId: string, zoneId: string, bookingId: string) => void;
};

export function BookingActions({
    booking,
    userRole,
    requestId,
    onApprove,
    onReject,
}: BookingActionsProps) {
    const { handleAction } = useBookingActions({
        booking,
        userRole,
        requestId,
    });

    const handleClick = useCallback(
        (actionType: 'approve' | 'reject') => (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            console.log(
                'Performing action. Booking ID:',
                booking.id,
                'Zone ID:',
                booking.zone.id,
                'Request ID:',
                requestId,
            );
            handleAction(actionType, onApprove, onReject);
        },
        [booking.id, booking.zone.id, requestId, handleAction, onApprove, onReject],
    );

    const shouldShowActions =
        (userRole === BookingRole.KM && booking.status === BookingStatus.PENDING_KM) ||
        (userRole === BookingRole.DMP && booking.status === BookingStatus.KM_APPROVED);

    const approveConfig = BOOKING_ACTIONS_CONFIG[userRole]?.approve;
    const rejectConfig = BOOKING_ACTIONS_CONFIG[userRole]?.reject;

    return (
        <>
            {shouldShowActions && (
                <div className="flex space-x-2">
                    {approveConfig && (
                        <Button
                            onClick={handleClick('approve')}
                            size="sm"
                            className="bg-green-300 hover:bg-green-500"
                            variant="outline"
                        >
                            <Check className="w-4 h-4" />
                        </Button>
                    )}
                    {rejectConfig && (
                        <Button
                            onClick={handleClick('reject')}
                            size="sm"
                            className="bg-red-300 hover:bg-red-600"
                            variant="outline"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            )}
        </>
    );
}
