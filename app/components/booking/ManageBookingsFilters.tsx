import React, { useEffect } from 'react';
import {
    useBookingRequestStore,
    type SimpleSupplier,
    type BookingRequestFilters, // Keep this type for FilterDropdownKey
} from '@/lib/stores/bookingRequestStore';
import { useLoaderStore } from '@/lib/stores/loaderStore'; // Import the loader store
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { BookingStatus } from '@prisma/client';
import { DateRangeFilter } from './DateRangeFilter'; // Import the new component
import { SearchFilters } from './SearchFilters'; // Import the new component
import { DropdownFilterGroup } from './DropdownFilterGroup'; // Import the new component
import { SelectedFiltersDisplay } from './SelectedFiltersDisplay'; // Import the new component

// Helper function to translate booking statuses
const translateStatus = (status: BookingStatus): string => {
    // Corrected status map based on TS errors and likely enum values
    const statusMap: Record<BookingStatus, string> = {
        [BookingStatus.PENDING_KM]: 'Ожидает КМ',
        [BookingStatus.KM_APPROVED]: 'Одобрено КМ',
        [BookingStatus.KM_REJECTED]: 'Отклонено КМ',
        [BookingStatus.DMP_APPROVED]: 'Одобрено DMP',
        [BookingStatus.DMP_REJECTED]: 'Отклонено DMP',
        // Добавьте сюда переводы для ЛЮБЫХ других статусов из BookingStatus, если они есть
    };
    return statusMap[status] || status; // Fallback to original if no translation
};

const ManageBookingsFilters = () => {
    const { user } = useAuth();
    const {
        filterCriteria, // Changed from filters
        setFilterCriteria, // Changed from setFilters
        resetFilters,
        // isLoading, // Removed - Will get from useLoaderStore
        fetchBookingRequests, // Changed from fetchBookings
        uniqueFilterValues,
    } = useBookingRequestStore(); // Changed hook name

    // Get loading state from the global loader store
    const isLoading = useLoaderStore(state => state.isLoading); // Assuming a general isLoading state

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
    const statusOptions = Object.values(BookingStatus).map(status => ({
        value: status,
        label: translateStatus(status), // Use translation function
    }));

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

    // Configuration for Main Dropdowns
    const mainDropdowns = [
        {
            title: 'Статус',
            options: statusOptions,
            selected: filterCriteria.status,
            filterKey: 'status' as keyof BookingRequestFilters & string, // Type assertion needed
        },
        // Conditionally add supplier dropdown if user is not a supplier
        ...(user?.role !== 'SUPPLIER'
            ? [
                  {
                      title: 'Поставщик (ИНН)',
                      options: supplierOptions,
                      selected: filterCriteria.supplierIds,
                      filterKey: 'supplierIds' as keyof BookingRequestFilters & string, // Type assertion needed
                  },
              ]
            : []),
    ];

    // Configuration for Zone Dropdowns
    const zoneDropdowns = [
        {
            title: 'Город',
            options: cityOptions,
            selected: filterCriteria.city,
            filterKey: 'city' as keyof BookingRequestFilters & string, // Type assertion needed
        },
        {
            title: 'Маркет',
            options: marketOptions,
            selected: filterCriteria.market,
            filterKey: 'market' as keyof BookingRequestFilters & string, // Type assertion needed
        },
        {
            title: 'Макрозона',
            options: macrozoneOptions,
            selected: filterCriteria.macrozone,
            filterKey: 'macrozone' as keyof BookingRequestFilters & string, // Type assertion needed
        },
        {
            title: 'Оборудование',
            options: equipmentOptions,
            selected: filterCriteria.equipment,
            filterKey: 'equipment' as keyof BookingRequestFilters & string, // Type assertion needed
        },
    ];

    // Handle filter changes from dropdowns
    // const handleFilterChange = ( ... ) => { ... }; // Removed - Handled by SimpleZoneFilterDropdown directly

    // Handle search term change
    const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterCriteria({ searchTerm: e.target.value }); // Changed function name
    };

    // Handle supplier name change (for the separate search input)
    const handleSupplierNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterCriteria({ supplierName: e.target.value }); // Changed function name
    };

    return (
        <Card className="mb-6 shadow-sm">
            <CardContent className="p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Выбор фильтров</h3>{' '}
                {/* TODO: i18n */}
                {/* Date Filters */}
                <DateRangeFilter
                    dateFrom={filterCriteria.dateFrom}
                    dateTo={filterCriteria.dateTo}
                    isLoading={isLoading}
                    onDateChange={(type, value) => setFilterCriteria({ [type]: value })} // Pass store update function directly
                />
                {/* Search Fields */}
                <SearchFilters
                    searchTerm={filterCriteria.searchTerm}
                    supplierName={filterCriteria.supplierName}
                    isLoading={isLoading}
                    onSearchTermChange={handleSearchTermChange}
                    onSupplierNameChange={handleSupplierNameChange}
                    userRole={user?.role} // Pass userRole prop
                />
                {/* Main Filters (Dropdowns) */}
                <DropdownFilterGroup
                    groupTitle="Основные фильтры"
                    dropdowns={mainDropdowns}
                    setFilterCriteria={setFilterCriteria}
                    isLoading={isLoading}
                />
                {/* Zone Filters (Dropdowns) */}
                <DropdownFilterGroup
                    groupTitle="Фильтры зон"
                    dropdowns={zoneDropdowns}
                    setFilterCriteria={setFilterCriteria}
                    isLoading={isLoading}
                />
                {/* Selected Filters Display */}
                <SelectedFiltersDisplay
                    filterCriteria={filterCriteria}
                    setFilterCriteria={setFilterCriteria}
                />
                {/* Reset Button */}
                <div className="flex justify-end pt-4">
                    {' '}
                    {/* Added padding-top */}
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
