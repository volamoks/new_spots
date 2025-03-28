import React, { useEffect } from 'react';
import { useBookingRequestStore, type BookingRequestFilters, type SimpleSupplier } from '@/lib/stores/bookingRequestStore'; // Changed import
import { SimpleZoneFilterDropdown } from '@/app/components/zones/SimpleZoneFilterDropdown';
import { ZoneSelectedFilters } from '@/app/components/zones/ZoneSelectedFilters';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { BookingStatus } from '@prisma/client'; // Import BookingStatus

const ManageBookingsFilters = () => {
    const { user } = useAuth();
    const {
        filterCriteria, // Changed from filters
        setFilterCriteria, // Changed from setFilters
        resetFilters,
        isLoading,
        fetchBookingRequests, // Changed from fetchBookings
        uniqueFilterValues,
    } = useBookingRequestStore(); // Changed hook name

    // Extract unique values for easier access
    const {
        suppliers: uniqueSuppliers,
        cities: uniqueCities,
        markets: uniqueMarkets,
        macrozones: uniqueMacrozones,
        equipments: uniqueEquipments,
        // statuses: uniqueStatuses, // Available if needed
    } = uniqueFilterValues;

    // Fetch bookings on component mount
    useEffect(() => {
        fetchBookingRequests(); // Changed function name
    }, [fetchBookingRequests]); // Changed dependency

    // Status options using BookingStatus enum
    // You might want a mapping for user-friendly labels here
    const statusOptions = Object.values(BookingStatus).map(status => ({
        value: status,
        label: status.replace(/_/g, ' '), // Simple label generation (e.g., PENDING KM)
    }));
    // Original status options (if preferred)
    // const statusOptions = [
    //     { value: 'PENDING_KM', label: 'Ожидает КМ' },
    //     { value: 'KM_APPROVED', label: 'Одобрено КМ' },
    //     { value: 'KM_REJECTED', label: 'Отклонено КМ' },
    //     { value: 'DMP_APPROVED', label: 'Одобрено DMP' },
    //     { value: 'DMP_REJECTED', label: 'Отклонено DMP' },
    // ];


    // Options for zone filters
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
    const supplierOptions = uniqueSuppliers.map((supplier: SimpleSupplier) => ({
        value: supplier.inn, // Use INN as value, matching filterCriteria.supplierIds
        label: supplier.name,
    }));

    // Define valid filter keys from the store, excluding ones handled separately
    type FilterDropdownKey = Exclude<keyof BookingRequestFilters, 'dateFrom' | 'dateTo' | 'searchTerm' | 'supplierName' | 'supplierInn'>;

    // Handle filter changes from dropdowns
    const handleFilterChange = (
        type: 'status' | 'supplier' | 'city' | 'market' | 'macrozone' | 'equipment', // Type from dropdown component
        values: string[],
    ) => {
        // Map 'supplier' type from dropdown to 'supplierIds' in store
        const storeKey: FilterDropdownKey = type === 'supplier' ? 'supplierIds' : type as FilterDropdownKey;

        // Ensure the value type matches the store expectation (BookingStatus[] for status)
        const storeValue = type === 'status' ? values as BookingStatus[] : values;

        setFilterCriteria({ [storeKey]: storeValue }); // Changed function name and key mapping
    };

    // Handle date changes
    const handleDateChange = (type: 'dateFrom' | 'dateTo', value: string) => {
        setFilterCriteria({ [type]: value }); // Changed function name
    };

    // Handle search term change
    const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterCriteria({ searchTerm: e.target.value }); // Changed function name
    };

    // Handle supplier name change (for the separate search input)
    const handleSupplierNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterCriteria({ supplierName: e.target.value }); // Changed function name
    };

    // Helper to get the correct filter key in the store based on the type from ZoneSelectedFilters
    const getFilterKeyForRemoval = (type: string): FilterDropdownKey | null => {
        if (type === 'supplier') return 'supplierIds';
        if (['status', 'city', 'market', 'macrozone', 'equipment'].includes(type)) {
            // Cast is safe here due to the check above
            return type as FilterDropdownKey;
        }
        return null;
    }

    return (
        <Card className="mb-6 shadow-sm">
            <CardContent className="p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Выберите фильтры</h3>

                {/* Date Filters */}
                <div className="flex w-full space-x-4">
                    <div className="flex flex-col flex-1">
                        <label className="text-sm font-medium mb-1 text-gray-700">Дата с</label>
                        <div className="flex items-center">
                            <Input
                                type="date"
                                value={
                                    filterCriteria.dateFrom // Changed variable
                                        ? new Date(filterCriteria.dateFrom).toISOString().split('T')[0]
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
                            {filterCriteria.dateFrom && ( // Changed variable
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-1 text-xs text-gray-500 h-8 w-8 p-0"
                                    onClick={() => handleDateChange('dateFrom', '')}
                                    aria-label="Clear start date" // Added aria-label
                                >
                                    ✕
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col flex-1">
                        <label className="text-sm font-medium mb-1 text-gray-700">Дата по</label>
                        <div className="flex items-center">
                            <Input
                                type="date"
                                value={
                                    filterCriteria.dateTo // Changed variable
                                        ? new Date(filterCriteria.dateTo).toISOString().split('T')[0]
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
                            {filterCriteria.dateTo && ( // Changed variable
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-1 text-xs text-gray-500 h-8 w-8 p-0"
                                    onClick={() => handleDateChange('dateTo', '')}
                                    aria-label="Clear end date" // Added aria-label
                                >
                                    ✕
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block text-gray-700">
                            Поиск по параметрам зон
                        </label>
                        <Input
                            type="text"
                            placeholder="Город, магазин, макрозона, оборудование..."
                            value={filterCriteria.searchTerm || ''} // Changed variable
                            onChange={handleSearchTermChange}
                            disabled={isLoading}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block text-gray-700">
                            Поиск по названию поставщика
                        </label>
                        <Input
                            type="text"
                            placeholder="Название поставщика..."
                            value={filterCriteria.supplierName || ''} // Changed variable
                            onChange={handleSupplierNameChange}
                            disabled={isLoading}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Main Filters (Dropdowns) */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Основные фильтры</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <SimpleZoneFilterDropdown
                            title="Статус"
                            options={statusOptions}
                            selected={filterCriteria.status} // Changed variable
                            onChange={(values: string[]) => handleFilterChange('status', values)}
                            isDisabled={isLoading}
                        />

                        {/* Only show supplier dropdown for non-supplier roles */}
                        {user?.role !== 'SUPPLIER' && (
                            <SimpleZoneFilterDropdown
                                title="Поставщик (ИНН)" // Clarified label
                                options={supplierOptions}
                                selected={filterCriteria.supplierIds || []} // Changed variable
                                onChange={(values: string[]) =>
                                    handleFilterChange('supplier', values) // Pass 'supplier' as type, handled in function
                                }
                                isDisabled={isLoading}
                            />
                        )}
                    </div>
                </div>

                {/* Zone Filters (Dropdowns) */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Фильтры по зонам</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <SimpleZoneFilterDropdown
                            title="Город"
                            options={cityOptions}
                            selected={filterCriteria.city || []} // Changed variable
                            onChange={(values: string[]) => handleFilterChange('city', values)}
                            isDisabled={isLoading}
                        />

                        <SimpleZoneFilterDropdown
                            title="Магазин"
                            options={marketOptions}
                            selected={filterCriteria.market || []} // Changed variable
                            onChange={(values: string[]) => handleFilterChange('market', values)}
                            isDisabled={isLoading}
                        />

                        <SimpleZoneFilterDropdown
                            title="Макрозона"
                            options={macrozoneOptions}
                            selected={filterCriteria.macrozone || []} // Changed variable
                            onChange={(values: string[]) => handleFilterChange('macrozone', values)}
                            isDisabled={isLoading}
                        />

                        <SimpleZoneFilterDropdown
                            title="Оборудование"
                            options={equipmentOptions}
                            selected={filterCriteria.equipment || []} // Changed variable
                            onChange={(values: string[]) => handleFilterChange('equipment', values)}
                            isDisabled={isLoading}
                        />
                    </div>
                </div>

                {/* Selected Filters Display */}
                {(filterCriteria.status.length > 0 ||
                    (filterCriteria.supplierIds && filterCriteria.supplierIds.length > 0) ||
                    (filterCriteria.city && filterCriteria.city.length > 0) ||
                    (filterCriteria.market && filterCriteria.market.length > 0) ||
                    (filterCriteria.macrozone && filterCriteria.macrozone.length > 0) ||
                    (filterCriteria.equipment && filterCriteria.equipment.length > 0)) && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200"> {/* Added margin-top and border */}
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Выбранные фильтры
                        </h4>
                        <ZoneSelectedFilters
                            // Pass the correct filter keys and values expected by ZoneSelectedFilters
                            // Assuming it expects 'supplier' key for supplier INNs
                            filters={{
                                status: filterCriteria.status,
                                supplier: filterCriteria.supplierIds || [], // Map supplierIds to 'supplier' key
                                city: filterCriteria.city || [],
                                market: filterCriteria.market || [],
                                macrozone: filterCriteria.macrozone || [],
                                equipment: filterCriteria.equipment || [],
                            }}
                            // Provide labels matching the keys passed in 'filters' prop
                            labels={{
                                status: 'Статус',
                                supplier: 'Поставщик (ИНН)', // Match dropdown title
                                city: 'Город',
                                market: 'Магазин',
                                macrozone: 'Макрозона',
                                equipment: 'Оборудование',
                            }}
                            onRemove={(type, value) => {
                                // 'type' here comes from ZoneSelectedFilters (e.g., 'status', 'supplier')
                                const filterKey = getFilterKeyForRemoval(type); // Get corresponding store key ('status', 'supplierIds')
                                if (filterKey) {
                                    // Get current values from the store using the correct key
                                    const currentValues = filterCriteria[filterKey] as string[] | undefined;
                                    // Filter out the removed value
                                    const newValues = currentValues?.filter(v => v !== value) || [];
                                    // Update the store with the new array using the correct key
                                    setFilterCriteria({ [filterKey]: newValues }); // Changed function name
                                }
                            }}
                            className="mt-2 flex flex-wrap gap-2" // Added flex styles
                        />
                    </div>
                )}

                {/* Reset Button */}
                <div className="flex justify-end pt-4"> {/* Added padding-top */}
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
