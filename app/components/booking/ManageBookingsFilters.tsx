import React, { useEffect } from 'react'; // Re-add useEffect
import {
    useBookingRequestStore,
    type BookingRequestFilters,
    type SupplierOption, // Import SupplierOption type
} from '@/lib/stores/bookingRequestStore';
import { useLoaderStore } from '@/lib/stores/loaderStore'; // Import the loader store
// import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { BookingStatus } from '@prisma/client';
import { DateRangeFilter } from './DateRangeFilter'; // Import the new component
import { SearchFilters } from './SearchFilters'; // Import the new component
import { DropdownFilterGroup } from './DropdownFilterGroup'; // Import the new component
import { SelectedFiltersDisplay } from './SelectedFiltersDisplay'; // Import the new component
import type { FilterCriteria as ZoneFilterCriteria } from '@/lib/stores/zonesStore'; // Import the expected type

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
        // Fetching options state and action
        filterOptions,
        isLoadingOptions,
        fetchFilterOptions,
    } = useBookingRequestStore();

    // Get loading state from the global loader store
    const isLoading = useLoaderStore(state => state.isLoading); // Assuming a general isLoading state

    // Fetch filter options on component mount
    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    // Status options using BookingStatus enum
    const statusOptions = Object.values(BookingStatus).map(status => ({
        value: status,
        label: translateStatus(status), // Use translation function
    }));

    // Options for zone filters derived from fetched options
    const cityOptions = filterOptions.cities.map(city => ({ value: city, label: city }));
    const marketOptions = filterOptions.markets.map(market => ({ value: market, label: market }));
    const macrozoneOptions = filterOptions.macrozones.map(macrozone => ({
        value: macrozone,
        label: macrozone,
    }));
    const equipmentOptions = filterOptions.equipments.map(equipment => ({
        value: equipment,
        label: equipment,
    }));

    // Supplier options derived from fetched options
    const supplierOptions = filterOptions.suppliers.map((supplier: SupplierOption) => ({
        value: supplier.inn, // Use INN as value
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

    // NOTE: zoneDropdowns definition was already correctly added in the previous partial apply
    // Re-create Zone Dropdowns configuration
    const zoneDropdowns = [
        {
            title: 'Город',
            options: cityOptions,
            selected: filterCriteria.city,
            filterKey: 'city' as keyof BookingRequestFilters & string,
        },
        {
            title: 'Маркет',
            options: marketOptions,
            selected: filterCriteria.market,
            filterKey: 'market' as keyof BookingRequestFilters & string,
        },
        {
            title: 'Макрозона',
            options: macrozoneOptions,
            selected: filterCriteria.macrozone,
            filterKey: 'macrozone' as keyof BookingRequestFilters & string,
        },
        {
            title: 'Оборудование',
            options: equipmentOptions,
            selected: filterCriteria.equipment,
            filterKey: 'equipment' as keyof BookingRequestFilters & string,
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

    // Adapter function to handle filter removal from SelectedFiltersDisplay
    const handleSelectedFilterRemove = (update: Partial<ZoneFilterCriteria>) => {
        // Translate ZoneFilterCriteria update back to BookingRequestFilters update
        const bookingUpdate: Partial<BookingRequestFilters> = {};

        // Map 'supplier' back to 'supplierIds'
        if (update.supplier !== undefined) {
            bookingUpdate.supplierIds = update.supplier;
        }
        // Map other common keys directly (if they exist in the update)
        if (update.city !== undefined) bookingUpdate.city = update.city;
        if (update.market !== undefined) bookingUpdate.market = update.market;
        if (update.macrozone !== undefined) bookingUpdate.macrozone = update.macrozone;
        if (update.equipment !== undefined) bookingUpdate.equipment = update.equipment;
        // Note: searchTerm and activeTab from ZoneFilterCriteria are not directly mapped back
        // as they might have different meanings or aren't used for removal in this context.

        // Call the original store setter function
        setFilterCriteria(bookingUpdate);
    };

    // Create an adapter object conforming to ZoneFilterCriteria for SelectedFiltersDisplay
    const displayCriteriaForSelectedFilters: ZoneFilterCriteria = {
        // Provide defaults or map existing values
        searchTerm: filterCriteria.searchTerm || '', // Map searchTerm
        activeTab: 'all', // Provide a default/placeholder - not displayed but needed for type
        city: filterCriteria.city || [], // Map city
        market: filterCriteria.market || [], // Map market
        macrozone: filterCriteria.macrozone || [], // Map macrozone
        equipment: filterCriteria.equipment || [], // Map equipment
        supplier: filterCriteria.supplierIds || [], // Map supplierIds to supplier
        category: undefined, // Not used in BookingRequestFilters
    };

    return (
        <div className="mb-6 shadow-sm">
            <div className="">
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
                {/* Re-enable Zone Filters Dropdown Group */}
                <DropdownFilterGroup
                    groupTitle="Фильтры зон"
                    dropdowns={zoneDropdowns}
                    setFilterCriteria={setFilterCriteria}
                    // Use isLoadingOptions to disable while options load, or general isLoading
                    isLoading={isLoadingOptions || isLoading} // Ensure this line uses the correct state
                />
                {/* Selected Filters Display */}
                <SelectedFiltersDisplay
                    filterCriteria={displayCriteriaForSelectedFilters} // Pass the adapted object
                    setFilterCriteria={handleSelectedFilterRemove} // Pass the adapter function
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
            </div>
        </div>
    );
};

export default ManageBookingsFilters;
