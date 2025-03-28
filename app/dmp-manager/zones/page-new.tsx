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
        zones, // Raw zones list
        // paginatedZones, // Unused: ZonesTable gets this from store
        // filterCriteria, // Unused: ZonesFilters gets this from store
        // uniqueFilterValues, // Object containing unique values for filters (used by ZonesFilters)
        isLoading,
        selectedZoneIds, // Now a Set<string>
        totalFilteredCount, // Total count after filtering, before pagination

        // Actions from zonesStore
        fetchZones,
        setFilterCriteria, // New action to set filters
        // toggleFilter, // Replaced by setFilterCriteria
        // removeFilter, // Replaced by setFilterCriteria

        // Actions from dmpManagerActionsStore (wrapped by the hook)
        bulkUpdateZoneStatus,
        bulkDeleteZones,
        updateZoneField,
    } = useDmpManagerZones();

    // Загружаем зоны при инициализации
    useEffect(() => {
        if (session) {
            fetchZones(); // Removed argument as fetchZones no longer accepts role
        }
    }, [session, fetchZones]);

    // Обработчик изменения статуса зоны
    // const handleStatusChange = async (zoneId: string, newStatus: ZoneStatus) => {
    //     try {
    //         await changeZoneStatus(zoneId, newStatus);
    //     } catch (error) {
    //         console.error('Ошибка при изменении статуса зоны:', error);
    //     }
    // };

    // Обработчик изменения сортировки (Removed - Handled by store/table)
    // const handleSortChange = (field: keyof Zone, direction: 'asc' | 'desc' | null) => {
    //     // Исправлен тип field
    //     setSorting(field, direction);
    // };

    // Обработчик изменения фильтра (Refactored for new store structure)
    const handleFilterChange = (
        type: 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier',
        values: string[], // values is the complete new array for this filter type
    ) => {
        // Ensure values is always an array
        const newValues = Array.isArray(values) ? values : [];

        // Update the specific filter array within filterCriteria using setFilterCriteria
        switch (type) {
            case 'city':
                setFilterCriteria({ cityFilters: newValues });
                break;
            case 'market':
                setFilterCriteria({ marketFilters: newValues });
                break;
            case 'macrozone':
                setFilterCriteria({ macrozoneFilters: newValues });
                break;
            case 'equipment':
                setFilterCriteria({ equipmentFilters: newValues });
                break;
            case 'supplier':
                setFilterCriteria({ supplierFilters: newValues });
                break;
        }
    };

    // Обработчик массового изменения статуса
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
            // Очистка выбора не нужна, т.к. стор сам это сделает при успехе
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                {/* Карточка с информацией */}
                <ZonesSummaryCard
                    totalCount={zones.length}
                    filteredCount={totalFilteredCount} // Use totalFilteredCount from store
                />

                {/* Фильтры */}
                <ZonesFilters
                    // Props removed as they are now accessed via useDmpManagerZones hook inside ZonesFilters:
                    // activeTab, searchTerm, cityFilters, marketFilters, macrozoneFilters,
                    // equipmentFilters, supplierFilters, uniqueCities, uniqueMarkets,
                    // uniqueMacrozones, uniqueEquipments, uniqueSuppliers, onTabChange,
                    // onSearchChange, onResetFilters, onRefresh, isLoading

                    // Keep props with custom handlers or specific config needed by ZonesFilters
                    onFilterChange={handleFilterChange} // Custom handler in this component
                    // onFilterRemove={removeFilter} // Removed - removeFilter action no longer exists
                    role="DMP_MANAGER"
                    className="mb-6"
                    // selectedCategory={/* Pass category if needed for macrozone logic */}
                />

                {/* Панель массовых действий */}
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
                <ZonesTable
                    // zones prop removed - table gets data from store
                    // onStatusChange больше не нужен для DMP в таблице
                    showActions={false} // Скрываем индивидуальные действия для DMP
                    // isLoading prop removed - table gets data from store
                    role="DMP_MANAGER"
                    // sortField prop removed - table gets data from store
                    // sortDirection prop removed - table gets data from store
                    // onSortChange prop removed - table uses store action
                    // selectedZones prop removed - table gets data from store
                    // onZoneSelect prop removed - table uses store action
                    // onSelectAll prop removed - table uses store action
                    // uniqueSuppliersFromDB prop removed - table gets data from store
                    onUpdateZoneField={async (zoneId, field, value) => {
                        // Wrap to match Promise<void>
                        await updateZoneField(zoneId, field, value);
                    }}
                    initialFetchRole="DMP_MANAGER" // Pass role for initial fetch if needed
                />
            </main>
        </div>
    );
}
