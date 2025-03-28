'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useDmpManagerZones } from '@/lib/stores/zones/dmpManagerZonesStore';
import { Zone, ZoneStatus } from '@/types/zone'; // Добавлен импорт Zone
import { ZonesSummaryCard } from '@/app/components/zones/ZonesSummaryCard';
import { ZonesFilters } from '@/app/components/zones/ZonesFilters';
import { ZonesTable } from '@/app/components/zones/ZonesTable';
import { Button } from '@/components/ui/button'; // Добавлено
import { Check, X, Trash2, Ban } from 'lucide-react'; // Добавлены иконки

export default function DmpManagerZonesPage() {
    const { data: session } = useSession();

    // Получаем состояние и методы из стора
    const {
        zones,
        filteredZones,
        activeTab,
        searchTerm,
        cityFilters,
        marketFilters,
        macrozoneFilters,
        equipmentFilters,
        supplierFilters,
        sortField,
        sortDirection,
        uniqueCities,
        uniqueMarkets,
        uniqueMacrozones,
        uniqueEquipments,
        uniqueSuppliers,
        isLoading,
        selectedZoneIds, // Добавлено
        setActiveTab,
        setSearchTerm,
        toggleFilter,
        removeFilter,
        setSorting,
        resetFilters,
        fetchZones,
        changeZoneStatus, // Оставляем для возможных индивидуальных действий в будущем, но не используем в таблице
        refreshZones,
        toggleZoneSelection, // Добавлено
        toggleSelectAll, // Добавлено
        bulkUpdateZoneStatus, // Добавлено
        bulkDeleteZones, // Добавлено
    } = useDmpManagerZones();

    // Загружаем зоны при инициализации
    useEffect(() => {
        if (session) {
            fetchZones('DMP_MANAGER');
        }
    }, [session, fetchZones]);

    // Обработчик изменения статуса зоны
    const handleStatusChange = async (zoneId: string, newStatus: ZoneStatus) => {
        try {
            await changeZoneStatus(zoneId, newStatus);
        } catch (error) {
            console.error('Ошибка при изменении статуса зоны:', error);
        }
    };

    // Обработчик изменения сортировки
    const handleSortChange = (field: keyof Zone, direction: 'asc' | 'desc' | null) => {
        // Исправлен тип field
        setSorting(field, direction);
    };

    // Обработчик изменения фильтра
    const handleFilterChange = (
        type: 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier',
        values: string[],
    ) => {
        // Сбрасываем текущие фильтры этого типа
        const currentFilters =
            type === 'city'
                ? cityFilters || []
                : type === 'market'
                ? marketFilters || []
                : type === 'macrozone'
                ? macrozoneFilters || []
                : type === 'equipment'
                ? equipmentFilters || []
                : supplierFilters || [];

        // Проверяем, что values - это массив
        const newValues = Array.isArray(values) ? values : [];

        // Удаляем старые фильтры
        currentFilters.forEach(value => {
            if (!newValues.includes(value)) {
                removeFilter(type, value);
            }
        });

        // Добавляем новые фильтры
        newValues.forEach(value => {
            if (!currentFilters.includes(value)) {
                toggleFilter(type, value);
            }
        });
    };

    // Обработчик массового изменения статуса
    const handleBulkStatusChange = async (newStatus: ZoneStatus) => {
        if (selectedZoneIds.length === 0) return;

        const statusMap = {
            [ZoneStatus.AVAILABLE]: 'Доступна',
            [ZoneStatus.BOOKED]: 'Забронирована',
            [ZoneStatus.UNAVAILABLE]: 'Недоступна',
        };
        const statusText = statusMap[newStatus] || newStatus;

        const confirmed = window.confirm(
            `Вы уверены, что хотите изменить статус ${selectedZoneIds.length} зон на "${statusText}"?`,
        );

        if (confirmed) {
            await bulkUpdateZoneStatus(selectedZoneIds, newStatus);
            // Очистка выбора не нужна, т.к. стор сам это сделает при успехе
        }
    };

    // Обработчик массового удаления
    const handleBulkDelete = async () => {
        if (selectedZoneIds.length === 0) return;

        const confirmed = window.confirm(
            `Вы уверены, что хотите удалить ${selectedZoneIds.length} зон? Это действие необратимо.`,
        );

        if (confirmed) {
            await bulkDeleteZones(selectedZoneIds);
            // Очистка выбора не нужна, т.к. стор сам это сделает при успехе
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                {/* Карточка с информацией */}
                <ZonesSummaryCard
                    totalCount={zones.length}
                    filteredCount={filteredZones.length}
                />

                {/* Фильтры */}
                <ZonesFilters
                    activeTab={activeTab}
                    searchTerm={searchTerm}
                    cityFilters={cityFilters}
                    marketFilters={marketFilters}
                    macrozoneFilters={macrozoneFilters}
                    equipmentFilters={equipmentFilters}
                    supplierFilters={supplierFilters}
                    uniqueCities={uniqueCities}
                    uniqueMarkets={uniqueMarkets}
                    uniqueMacrozones={uniqueMacrozones}
                    uniqueEquipments={uniqueEquipments}
                    uniqueSuppliers={uniqueSuppliers}
                    onTabChange={setActiveTab}
                    onSearchChange={setSearchTerm}
                    onFilterChange={handleFilterChange}
                    onFilterRemove={removeFilter}
                    onResetFilters={resetFilters}
                    onRefresh={refreshZones}
                    isLoading={isLoading}
                    role="DMP_MANAGER"
                    className="mb-6"
                />

                {/* Панель массовых действий */}
                {selectedZoneIds.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-200 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <p className="font-medium text-blue-800">
                                Выбрано зон: {selectedZoneIds.length}
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
                                    className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300"
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
                <ZonesTable
                    zones={filteredZones}
                    // onStatusChange больше не нужен для DMP в таблице
                    showActions={false} // Скрываем индивидуальные действия для DMP
                    isLoading={isLoading}
                    role="DMP_MANAGER"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={handleSortChange}
                    selectedZones={selectedZoneIds} // Исправлено: используем пропс selectedZones
                    onZoneSelect={toggleZoneSelection} // Передаем обработчик выбора
                    onSelectAll={toggleSelectAll} // Передаем обработчик выбора всех
                />
            </main>
        </div>
    );
}
