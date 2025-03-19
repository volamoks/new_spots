'use client';

import React from 'react';
import { useBookingStore } from '@/lib/stores/bookingStore';
import { useBookingZonesStore } from '@/lib/stores/bookingZonesStore';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';

const CreateBookingActions = () => {
    const { createBooking, selectedZones, clearSelectedZones } = useBookingStore();
    const { isLoading, refreshZones } = useBookingZonesStore();
    const { data: session } = useSession();

    const handleCreateBooking = async () => {
        if (selectedZones.length === 0 || !session?.user) return;

        try {
            // Convert session.user to SimplifiedUser
            const simplifiedUser = {
                id: session.user.id,
                role: session.user.role,
                category: session.user.category,
            };

            await createBooking(selectedZones, simplifiedUser, session.user.inn);
            clearSelectedZones(); // Clear selected zones after successful booking
        } catch (error) {
            console.error('Ошибка при создании бронирования:', error);
        }
    };

    return (
        <div className="flex gap-2 m-6 ">
            <Button
                onClick={refreshZones}
                disabled={isLoading}
                className="whitespace-nowrap bg-red-600 hover:bg-red-700"
            >
                <RefreshCw className="mr-2 h-4 w-4" />
                Обновить
            </Button>
            <Button
                onClick={handleCreateBooking}
                disabled={isLoading || selectedZones.length === 0}
                className="whitespace-nowrap bg-red-600 hover:bg-red-700"
            >
                Создать бронирование ({selectedZones.length})
            </Button>
        </div>
    );
};

export default CreateBookingActions;
