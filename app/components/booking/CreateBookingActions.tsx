'use client';

import React from 'react';
import { useBookingStore } from '@/lib/stores/bookingStore';
import { useBookingZonesStore } from '@/lib/stores/bookingZonesStore';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useLoader } from '@/app/components/GlobalLoader';

const CreateBookingActions = () => {
    const { createBooking, selectedZones, clearSelectedZones, selectedSupplierInn } =
        useBookingStore();
    const { isLoading, refreshZones } = useBookingZonesStore();
    const { data: session } = useSession();
    const { setLoading } = useLoader();

    const handleCreateBooking = async () => {
        if (selectedZones.length === 0 || !session?.user) return;

        try {
            // Convert session.user to SimplifiedUser
            const simplifiedUser = {
                id: session.user.id,
                role: session.user.role,
                category: session.user.category,
            };

            // For Category Managers, use the selected supplier INN
            // For Suppliers, use their own INN from the session
            const supplierInnToUse =
                session.user.role === 'CATEGORY_MANAGER'
                    ? selectedSupplierInn
                    : session.user.inn || null;

            // Show the loader before calling createBooking
            setLoading(true, 'Создание бронирования...');
            try {
                await createBooking(selectedZones, simplifiedUser, supplierInnToUse);
            } finally {
                setLoading(false);
            }
            clearSelectedZones(); // Clear selected zones after successful booking
        } catch (error) {
            console.error('Ошибка при создании бронирования:', error);
        }
    };

    const handleRefresh = async () => {
        try {
            setLoading(true, 'Обновление списка зон...');
            await refreshZones();
        } catch (error) {
            console.error('Ошибка при обновлении зон:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-2 m-6 ">
            <Button
                onClick={handleRefresh}
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
