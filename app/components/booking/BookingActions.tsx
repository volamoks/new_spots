import React from 'react';
import { useBookingStore } from '@/lib/stores/bookingStore';
import { useFilterStore } from '@/lib/stores/filterStore';
import { useZonesStore } from '@/lib/stores/zonesStore';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const BookingActions = () => {
    const { createBooking, selectedZones, clearSelectedZones } = useBookingStore();
    const { resetFilters } = useFilterStore();
    const { isLoading, refreshZones } = useZonesStore();

  const handleCreateBooking = async () => {
    if (selectedZones.length === 0) return;

    try {
      await createBooking(selectedZones);
      clearSelectedZones(); // Clear selected zones after successful booking
    } catch (error) {
      console.error('Ошибка при создании бронирования:', error);
    }
  };

    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                onClick={resetFilters}
                disabled={isLoading}
                className="whitespace-nowrap"
            >
                Сбросить фильтры
            </Button>
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
