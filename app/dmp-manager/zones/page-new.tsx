'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useDmpManagerZones } from '@/lib/stores/zones/dmpManagerZonesStore';
import { ZoneStatus } from '@/types/zone'; // Убран неиспользуемый Zone
import { ZonesSummaryCard } from '@/app/components/zones/ZonesSummaryCard';
import { ZonesFilters } from '@/app/components/zones/ZonesFilters';
import { ZonesTable } from '@/app/components/zones/ZonesTable';
import { Button } from '@/components/ui/button'; // Добавлено
import { Check, X, Trash2, Ban } from 'lucide-react'; // Добавлены иконки

export default function DmpManagerZonesPage() {
    const { data: session } = useSession();

    // Получаем состояние и методы из стора
    const {
        isLoading,
        selectedZoneIds, // Now a Set<string>

        fetchZones,
        fetchFilterOptions, // Added action

        bulkUpdateZoneStatus,
        bulkDeleteZones,
    } = useDmpManagerZones();

    useEffect(() => {
        if (session) {
            // Fetch both zones and filter options on mount
            fetchZones();
            fetchFilterOptions();
        }
    }, [session, fetchZones, fetchFilterOptions]);

    const handleBulkStatusChange = async (newStatus: ZoneStatus) => {
        if (selectedZoneIds.size === 0) return; // Use .size for Set

        const statusMap = {
            [ZoneStatus.AVAILABLE]: 'Доступна',
            [ZoneStatus.BOOKED]: 'Забронирована',
            [ZoneStatus.UNAVAILABLE]: 'Недоступна',
        };
        const statusText = statusMap[newStatus] || newStatus;

        const confirmed = window.confirm(
            `Вы уверены, что хотите изменить статус ${selectedZoneIds.size} зон на "${statusText}"?`, // Use .size for Set
        );

        if (confirmed) {
            await bulkUpdateZoneStatus(Array.from(selectedZoneIds), newStatus); // Convert Set to Array
            // Очистка выбора не нужна, т.к. стор сам это сделает при успехе
        }
    };

    // Обработчик массового удаления
    const handleBulkDelete = async () => {
        if (selectedZoneIds.size === 0) return; // Use .size for Set

        const confirmed = window.confirm(
            `Вы уверены, что хотите удалить ${selectedZoneIds.size} зон? Это действие необратимо.`, // Use .size for Set
        );

        if (confirmed) {
            await bulkDeleteZones(Array.from(selectedZoneIds)); // Convert Set to Array
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <ZonesSummaryCard />
                <ZonesFilters />
                {selectedZoneIds.size > 0 && ( // Use .size for Set
                    <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-200 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <p className="font-medium text-blue-800">
                                Выбрано зон: {selectedZoneIds.size} {/* Use .size for Set */}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300"
                                    onClick={() => handleBulkStatusChange(ZoneStatus.AVAILABLE)}
                                    disabled={isLoading}
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    Сделать доступными
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300"
                                    onClick={() => handleBulkStatusChange(ZoneStatus.BOOKED)}
                                    disabled={isLoading}
                                >
                                    <X className="mr-2 h-4 w-4" />{' '}
                                    {/* Иконка может быть не идеальной */}
                                    Забронировать
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300" // Заменены классы на красные
                                    onClick={() => handleBulkStatusChange(ZoneStatus.UNAVAILABLE)}
                                    disabled={isLoading}
                                >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Сделать недоступными
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleBulkDelete}
                                    disabled={isLoading}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Удалить выбранные
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Таблица зон */}
                <ZonesTable />
            </main>
        </div>
    );
}
