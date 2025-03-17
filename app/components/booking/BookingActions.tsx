import React from 'react';
import { useBookingStore } from '@/lib/stores/bookingStore';
// import { useFilterStore } from '@/lib/stores/filterStore';
import { useZonesStore } from '@/lib/stores/zonesStore';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth'; // Import useAuth
import { useToast } from '@/components/ui/use-toast'; // Import useToast

const BookingActions = () => {
    const { createBooking, selectedZones, clearSelectedZones, selectedSupplierInn } =
        useBookingStore(); // Get selectedSupplierInn
    const { user } = useAuth(); // Get the user
    const { isLoading, refreshZones } = useZonesStore();
    const { toast } = useToast(); // Get the toast function

    const handleCreateBooking = async () => {
        if (selectedZones.length === 0) {
            toast({
                title: 'Ошибка',
                description: 'Выберите зоны для бронирования.',
                variant: 'destructive',
            });
            return;
        }

        if (!user) {
            toast({
                title: 'Ошибка',
                description: 'Пользователь не авторизован.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await createBooking(selectedZones, user, selectedSupplierInn); // Pass user and selectedSupplierInn
            console.log(selectedZones);
            clearSelectedZones(); // Clear selected zones after successful booking
        } catch (error) {
            console.error('Ошибка при создании бронирования:', error);
            toast({
                title: 'Ошибка',
                description:
                    'Не удалось создать бронирование. ' +
                    (error instanceof Error ? error.message : ''),
                variant: 'destructive',
            });
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

export default BookingActions;
