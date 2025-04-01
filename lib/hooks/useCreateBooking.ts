'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface UseCreateBookingProps {
    /** Callback function to execute on successful booking creation. */
    onSuccess?: () => void;
}

/**
 * Custom hook to handle the logic for creating a booking request.
 * Encapsulates API call, loading state, and success/error notifications.
 */
export function useCreateBooking({ onSuccess }: UseCreateBookingProps = {}) {
    const [isBookingLoading, setIsBookingLoading] = useState(false);
    const { toast } = useToast();

    /**
     * Creates a booking request for the given zone IDs and user ID.
     * @param zoneIds - An array of zone IDs to book.
     * @param userId - The ID of the user creating the booking.
     */
    const createBooking = async (zoneIds: string[], userId: string | undefined) => {
        // Prevent multiple clicks while loading or if data is missing
        if (isBookingLoading || zoneIds.length === 0 || !userId) {
            if (zoneIds.length === 0) {
                toast({
                    title: 'Нет выбранных зон',
                    description: 'Пожалуйста, выберите хотя бы одну зону для бронирования.',
                    variant: 'default', // Use default variant instead of warning
                });
            } else if (!userId) {
                toast({
                    title: 'Ошибка',
                    description: 'Не удалось получить ID пользователя.',
                    variant: 'destructive',
                });
            }
            return;
        }

        setIsBookingLoading(true);
        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    zoneIds: zoneIds,
                    userId: userId,
                }),
            });

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => ({ error: 'Failed to create booking request' }));
                throw new Error(errorData.error || 'Failed to create booking request');
            }

            // Success case
            toast({
                title: 'Заявка создана',
                description: `Заявка на бронирование ${zoneIds.length} зон успешно создана.`,
                variant: 'success',
            });
            onSuccess?.(); // Call the success callback if provided (e.g., to clear selection)

        } catch (error) {
            console.error('Ошибка при создании бронирования:', error);
            toast({
                title: 'Ошибка бронирования',
                description: error instanceof Error ? error.message : 'Не удалось создать заявку.',
                variant: 'destructive',
            });
        } finally {
            setIsBookingLoading(false);
        }
    };

    return { createBooking, isBookingLoading };
}