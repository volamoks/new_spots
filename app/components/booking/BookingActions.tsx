'use client';

import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { BookingStatus } from '@prisma/client';

type BookingActionsProps = {
    booking: {
        id: string;
        status: BookingStatus;
        zone: {
            id: string;
        };
    };
    role: 'КМ' | 'ДМП' | 'Поставщик';
    requestId: string;
    onApprove: (requestId: string, zoneId: string) => void;
    onReject?: (requestId: string, zoneId: string, bookingId: string) => void;
};

export function BookingActions({
    booking,
    role,
    requestId,
    onApprove,
    onReject,
}: BookingActionsProps) {
    return (
        <>
            {((role === 'КМ' && booking.status === BookingStatus.PENDING_KM) ||
                (role === 'ДМП' && booking.status === BookingStatus.KM_APPROVED)) && (
                <div className="flex space-x-2">
                    <Button
                        onClick={e => {
                            e.stopPropagation();
                            console.log(
                                'Approving booking. Booking ID:',
                                booking.id,
                                'Zone ID:',
                                booking.zone.id,
                                'Request ID:',
                                requestId,
                            );
                            onApprove(requestId, booking.zone.id);
                        }}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                    >
                        <Check className="w-4 h-4" />
                    </Button>
                    <Button
                        onClick={e => {
                            e.stopPropagation();
                            if (onReject) {
                                console.log(
                                    'Rejecting booking. Booking ID:',
                                    booking.id,
                                    'Zone ID:',
                                    booking.zone.id,
                                    'Request ID:',
                                    requestId,
                                );
                                onReject(requestId, booking.zone.id, booking.id);
                            }
                        }}
                        size="sm"
                        variant="destructive"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </>
    );
}
