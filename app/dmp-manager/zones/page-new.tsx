'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useDmpManagerZones } from '@/lib/stores/zones/dmpManagerZonesStore';
import { ZoneStatus } from '@/types/zone';
import { ZonesSummaryCard } from '@/app/components/zones/ZonesSummaryCard';
import { ZonesFilters } from '@/app/components/zones/ZonesFilters';
import { ZonesTable } from '@/app/components/zones/ZonesTable';

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
        setActiveTab,
        setSearchTerm,
        toggleFilter,
        removeFilter,
        setSorting,
        resetFilters,
        fetchZones,
        changeZoneStatus,
        refreshZones,
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
    const handleSortChange = (field: string, direction: 'asc' | 'desc' | null) => {
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

                {/* Таблица зон */}
                <ZonesTable
                    zones={filteredZones}
                    onStatusChange={handleStatusChange}
                    showActions={true}
                    isLoading={isLoading}
                    role="DMP_MANAGER"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={handleSortChange}
                />
            </main>
        </div>
    );
}
