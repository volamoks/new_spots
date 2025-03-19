import { useCallback } from 'react';
import { BookingStatus } from '@prisma/client';
import BookingRole from '@/lib/enums/BookingRole';
import { toast } from '@/components/ui/use-toast';
import { useManageBookingsStore } from '@/lib/stores/manageBookingsStore';

const getBookingStatus = (actionType: 'approve' | 'reject', userRole: BookingRole): BookingStatus | undefined => {
    switch (actionType) {
        case 'approve':
            if (userRole === BookingRole.KM) {
                return BookingStatus.KM_APPROVED;
            } else if (userRole === BookingRole.DMP) {
                return BookingStatus.DMP_APPROVED;
            }
            break;
        case 'reject':
            if (userRole === BookingRole.KM) {
                return BookingStatus.KM_REJECTED;
            } else if (userRole === BookingRole.DMP) {
                return BookingStatus.DMP_REJECTED;
            }
            break;
    }
    return undefined;
};
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
};

export const useBookingActions = ({
    booking,
    userRole,
    requestId,
}: BookingActionsProps) => {
    // Get the fetchBookings function from the manageBookingsStore
    const fetchBookings = useManageBookingsStore(state => state.fetchBookings);

    const handleAction = useCallback(async (actionType: 'approve' | 'reject', onApprove: (bookingId: string, zoneId: string) => void, onReject?: (requestId: string, zoneId: string, bookingId: string) => void) => {
        const status = getBookingStatus(actionType, userRole);
        if (!status) {
            console.error('Invalid action type or role');
            return;
        }

        try {
            const response = await fetch(`/api/bookings/${booking.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: status, role: userRole }),
            });

            if (!response.ok) {
                console.error('Error performing action:', response.status, response.statusText);
                toast({
                    title: 'Ошибка',
                    description: 'Не удалось обновить статус бронирования',
                    variant: 'destructive',
                });
                return;
            }

            // Update the booking status in the local state
            const updateBookingInStore = useManageBookingsStore.getState();
            const allBookings = [...updateBookingInStore.allBookings];
            const filteredBookings = [...updateBookingInStore.filteredBookings];

            // Update both allBookings and filteredBookings
            [allBookings, filteredBookings].forEach(bookingsList => {
                for (const bookingRequest of bookingsList) {
                    for (let i = 0; i < bookingRequest.bookings.length; i++) {
                        if (bookingRequest.bookings[i].id === booking.id) {
                            bookingRequest.bookings[i].status = status;
                        }
                    }
                }
            });

            // Update the store with the modified bookings
            updateBookingInStore.filteredBookings = filteredBookings;

            // Call the callbacks
            if (actionType === 'approve') {
                onApprove(booking.id, booking.zone.id);
            } else if (onReject) {
                onReject(requestId, booking.zone.id, booking.id);
            }

        } catch (error: unknown) {
            console.error('Error performing action:', error);
            toast({
                title: 'Ошибка',
                description: 'Не удалось обновить статус бронирования',
                variant: 'destructive',
            });
        }
    }, [booking.id, booking.zone.id, userRole, requestId, fetchBookings]);

    return { handleAction };
};