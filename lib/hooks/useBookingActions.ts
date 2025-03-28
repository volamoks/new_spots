import { useCallback } from 'react';
import { BookingStatus } from '@prisma/client';
import BookingRole from '@/lib/enums/BookingRole';
import { toast } from '@/components/ui/use-toast';
import { useBookingRequestStore } from '@/lib/stores/bookingRequestStore';
import { useLoaderStore } from '@/lib/stores/loaderStore';

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
    // Get actions from the correct stores
    const updateBookingStatusLocally = useBookingRequestStore(state => state.updateBookingStatusLocally);
    const withLoading = useLoaderStore(state => state.withLoading); // Get withLoading function

    const handleAction = useCallback(async (actionType: 'approve' | 'reject', onApprove: (bookingId: string, zoneId: string) => void, onReject?: (requestId: string, zoneId: string, bookingId: string) => void) => {
        const newStatus = getBookingStatus(actionType, userRole);
        if (!newStatus) {
            console.error('Invalid action type or role');
            toast({
                title: 'Ошибка',
                description: 'Недопустимое действие или роль пользователя.',
                variant: 'destructive',
            });
            return;
        }

        // Define the core logic as an async function to be wrapped
        const actionLogic = async () => {
            // Make the API call
            const response = await fetch(`/api/bookings/${booking.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus, role: userRole }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to update booking status' }));
                console.error('Error performing action:', response.status, response.statusText, errorData);
                // Throw an error to be caught by the outer catch block
                throw new Error(errorData.message || 'Не удалось обновить статус бронирования');
            }

            // Update the booking status in the local store
            updateBookingStatusLocally(booking.id, newStatus);

            toast({
                title: 'Успех',
                description: `Статус бронирования успешно обновлен на ${newStatus.replace(/_/g, ' ')}.`,
            });

            // Call the callbacks
            if (actionType === 'approve') {
                onApprove(booking.id, booking.zone.id);
            } else if (onReject) {
                onReject(requestId, booking.zone.id, booking.id);
            }
        };

        // Wrap the action logic with the loader
        try {
            await withLoading(
                actionLogic(), // Execute the async function
                'Обновление статуса бронирования...' // Loading message
            );
        } catch (error: unknown) {
            // Handle errors thrown from actionLogic or withLoading itself
            console.error('Error performing action:', error);
            const message = error instanceof Error ? error.message : 'Произошла неизвестная ошибка';
            toast({
                title: 'Ошибка',
                description: message,
                variant: 'destructive',
            });
            // No finally block needed here as withLoading handles resetting the loader state
        }
    }, [booking.id, booking.zone.id, userRole, requestId, updateBookingStatusLocally, withLoading]); // Added withLoading to dependencies

    return { handleAction };
};