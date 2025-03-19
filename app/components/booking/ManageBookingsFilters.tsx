import React, { useEffect } from 'react';
import { useManageBookingsStore } from '@/lib/stores/manageBookingsStore';
import { SimpleZoneFilterDropdown } from '@/app/components/zones/SimpleZoneFilterDropdown';
import { ZoneSelectedFilters } from '@/app/components/zones/ZoneSelectedFilters';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';

const ManageBookingsFilters = () => {
    const { user } = useAuth();
    const {
        filters,
        setFilters,
        resetFilters,
        isLoading,
        fetchBookings,
        uniqueSuppliers,
        uniqueCities,
        uniqueMarkets,
        uniqueMacrozones,
        uniqueEquipments,
    } = useManageBookingsStore();

    // Fetch bookings on component mount
    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Status options
    const statusOptions = [
        { value: 'PENDING_KM', label: 'Ожидает КМ' },
        { value: 'KM_APPROVED', label: 'Одобрено КМ' },
        { value: 'KM_REJECTED', label: 'Отклонено КМ' },
        { value: 'DMP_APPROVED', label: 'Одобрено DMP' },
        { value: 'DMP_REJECTED', label: 'Отклонено DMP' },
    ];

    // Options for new filters
    const cityOptions = uniqueCities.map(city => ({ value: city, label: city }));
    const marketOptions = uniqueMarkets.map(market => ({ value: market, label: market }));
    const macrozoneOptions = uniqueMacrozones.map(macrozone => ({
        value: macrozone,
        label: macrozone,
    }));
    const equipmentOptions = uniqueEquipments.map(equipment => ({
        value: equipment,
        label: equipment,
    }));

    // Supplier options
    const supplierOptions = uniqueSuppliers.map(supplier => ({
        value: supplier.inn,
        label: supplier.name,
    }));

    // Handle filter changes
    const handleFilterChange = (
        type: 'status' | 'supplier' | 'city' | 'market' | 'macrozone' | 'equipment',
        values: string[],
    ) => {
        setFilters({ [type]: values });
    };

    // Handle date changes
    const handleDateChange = (type: 'dateFrom' | 'dateTo', value: string) => {
        setFilters({ [type]: value });
    };

    // Handle search term change
    const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ searchTerm: e.target.value });
    };

    // Handle supplier name change
    const handleSupplierNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ supplierName: e.target.value });
    };

    return (
        <Card className="mb-6 shadow-sm">
            <CardContent className="p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Выберите фильтры</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1 text-gray-700">Дата с</label>
                        <div className="flex items-center">
                            <Input
                                type="date"
                                value={
                                    filters.dateFrom
                                        ? new Date(filters.dateFrom).toISOString().split('T')[0]
                                        : ''
                                }
                                onChange={e =>
                                    handleDateChange(
                                        'dateFrom',
                                        e.target.value
                                            ? new Date(e.target.value).toISOString()
                                            : '',
                                    )
                                }
                                disabled={isLoading}
                                className="w-full"
                            />
                            {filters.dateFrom && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-1 text-xs text-gray-500 h-8 w-8 p-0"
                                    onClick={() => handleDateChange('dateFrom', '')}
                                >
                                    ✕
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1 text-gray-700">Дата по</label>
                        <div className="flex items-center">
                            <Input
                                type="date"
                                value={
                                    filters.dateTo
                                        ? new Date(filters.dateTo).toISOString().split('T')[0]
                                        : ''
                                }
                                onChange={e =>
                                    handleDateChange(
                                        'dateTo',
                                        e.target.value
                                            ? new Date(e.target.value).toISOString()
                                            : '',
                                    )
                                }
                                disabled={isLoading}
                                className="w-full"
                            />
                            {filters.dateTo && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-1 text-xs text-gray-500 h-8 w-8 p-0"
                                    onClick={() => handleDateChange('dateTo', '')}
                                >
                                    ✕
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Поисковые поля */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                        <label className="text-sm font-medium mb-1 block text-gray-700">
                            Поиск по параметрам
                        </label>
                        <Input
                            type="text"
                            placeholder="Город, магазин, макрозона..."
                            value={filters.searchTerm || ''}
                            onChange={handleSearchTermChange}
                            disabled={isLoading}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block text-gray-700">
                            Поиск по поставщику
                        </label>
                        <Input
                            type="text"
                            placeholder="Название поставщика..."
                            value={filters.supplierName || ''}
                            onChange={handleSupplierNameChange}
                            disabled={isLoading}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Основные фильтры */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Основные фильтры</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <SimpleZoneFilterDropdown
                            title="Статус"
                            options={statusOptions}
                            selected={filters.status}
                            onChange={(values: string[]) => handleFilterChange('status', values)}
                            isDisabled={isLoading}
                        />

                        {/* Date filters */}

                        {/* Only show supplier filter for non-supplier roles */}
                        {user?.role !== 'SUPPLIER' && (
                            <SimpleZoneFilterDropdown
                                title="Поставщик"
                                options={supplierOptions}
                                selected={filters.supplier || []}
                                onChange={(values: string[]) =>
                                    handleFilterChange('supplier', values)
                                }
                                isDisabled={isLoading}
                            />
                        )}
                    </div>
                </div>

                {/* Дополнительные фильтры */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Фильтры по зонам</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <SimpleZoneFilterDropdown
                            title="Город"
                            options={cityOptions}
                            selected={filters.city || []}
                            onChange={(values: string[]) => handleFilterChange('city', values)}
                            isDisabled={isLoading}
                        />

                        <SimpleZoneFilterDropdown
                            title="Магазин"
                            options={marketOptions}
                            selected={filters.market || []}
                            onChange={(values: string[]) => handleFilterChange('market', values)}
                            isDisabled={isLoading}
                        />

                        <SimpleZoneFilterDropdown
                            title="Макрозона"
                            options={macrozoneOptions}
                            selected={filters.macrozone || []}
                            onChange={(values: string[]) => handleFilterChange('macrozone', values)}
                            isDisabled={isLoading}
                        />

                        <SimpleZoneFilterDropdown
                            title="Оборудование"
                            options={equipmentOptions}
                            selected={filters.equipment || []}
                            onChange={(values: string[]) => handleFilterChange('equipment', values)}
                            isDisabled={isLoading}
                        />
                    </div>
                </div>

                {/* Выбранные фильтры */}
                {(filters.status.length > 0 ||
                    (filters.supplier && filters.supplier.length > 0) ||
                    (filters.city && filters.city.length > 0) ||
                    (filters.market && filters.market.length > 0) ||
                    (filters.macrozone && filters.macrozone.length > 0) ||
                    (filters.equipment && filters.equipment.length > 0)) && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Выбранные фильтры
                        </h4>
                        <ZoneSelectedFilters
                            filters={{
                                status: filters.status,
                                supplier: filters.supplier || [],
                                city: filters.city || [],
                                market: filters.market || [],
                                macrozone: filters.macrozone || [],
                                equipment: filters.equipment || [],
                            }}
                            labels={{
                                status: 'Статус',
                                supplier: 'Поставщик',
                                city: 'Город',
                                market: 'Магазин',
                                macrozone: 'Макрозона',
                                equipment: 'Оборудование',
                            }}
                            onRemove={(type, value) => {
                                // Обновляем обработчик, чтобы он работал со всеми типами фильтров
                                const newValues = filters[type]?.filter(v => v !== value) || [];
                                setFilters({ [type]: newValues });
                            }}
                            className="mt-2"
                        />
                    </div>
                )}

                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        onClick={resetFilters}
                        disabled={isLoading}
                        className="whitespace-nowrap"
                    >
                        Сбросить все фильтры
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default ManageBookingsFilters;
