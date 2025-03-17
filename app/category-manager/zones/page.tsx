'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useZonesStore } from '@/lib/stores/zonesStore';
import { useFilterStore } from '@/lib/stores/filterStore';
import { useBookingStore } from '@/lib/stores/bookingStore';
import { ZonesSummaryCard } from '@/app/components/zones/ZonesSummaryCard';
import { ZonesFilters } from '@/app/components/zones/ZonesFilters';
import { ZonesTable } from '@/app/components/zones/ZonesTable';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getCategories } from '@/lib/filterData';

interface SupplierOption {
    id: string;
    name: string;
    supplierName: string;
}

export default function CategoryManagerZonesPage() {
    const { data: session } = useSession();
    const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
    const [categories, setCategories] = useState<string[]>([]);

    const {
        zones,
        isLoading,
        fetchZones,
        refreshZones,
        uniqueCities,
        uniqueMarkets,
        uniqueMacrozones,
        uniqueEquipments,
        uniqueSuppliers,
    } = useZonesStore();
    const {
        activeTab,
        searchTerm,
        cityFilters,
        marketFilters,
        macrozoneFilters,
        equipmentFilters,
        supplierFilters,
        sortField,
        sortDirection,
        setActiveTab,
        setSearchTerm,
        toggleFilter,
        removeFilter,
        setSorting,
        resetFilters,
        applyFilters,
        setCategoryFilter,
        categoryFilter,
    } = useFilterStore();
    const {
        selectedZones,
        selectedSupplierInn,
        addSelectedZone,
        removeSelectedZone,
        // clearSelectedZones,
        setSelectedSupplierInn,
        createBooking,
    } = useBookingStore();

    const filteredZones = applyFilters(zones);

    // Fetch suppliers and categories on component mount
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await fetch('/api/suppliers');
                if (!response.ok) {
                    throw new Error('Failed to fetch suppliers');
                }
                const data = await response.json();
                setSuppliers(data);
            } catch (error) {
                console.error('Error fetching suppliers:', error);
            }
        };

        fetchSuppliers();
        setCategories(getCategories());
    }, []);

    // Fetch zones when the component mounts or the session changes
    useEffect(() => {
        if (session) {
            console.log('Fetching zones for category manager');
            fetchZones('CATEGORY_MANAGER', categoryFilter || undefined)
                .then(() => console.log('Zones fetched successfully'))
                .catch(error => console.error('Error fetching zones:', error));
        }
    }, [session, fetchZones, categoryFilter]);

    // Zone selection handler
    const handleZoneSelection = (zoneId: string) => {
        if (selectedZones.includes(zoneId)) {
            removeSelectedZone(zoneId);
        } else {
            addSelectedZone(zoneId);
        }
    };

    // Booking creation handler
    const handleCreateBooking = async () => {
        if (selectedZones.length === 0 || !selectedSupplierInn) return;

        try {
            await createBooking(selectedZones);
        } catch (error) {
            console.error('Error creating booking:', error);
        }
    };

    // Sort change handler
    const handleSortChange = (field: Zone, direction: 'asc' | 'desc' | null) => {
        setSorting(field, direction);
    };

    // Filter change handler
    const handleFilterChange = (
        type: 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier',
        values: string[],
    ) => {
        // Reset current filters of the given type
        const currentFilters =
            type === 'city'
                ? cityFilters
                : type === 'market'
                ? marketFilters
                : type === 'macrozone'
                ? macrozoneFilters
                : type === 'equipment'
                ? equipmentFilters
                : supplierFilters;

        // Remove old filters
        currentFilters.forEach(value => {
            if (!values.includes(value)) {
                removeFilter(type, value);
            }
        });

        // Add new filters
        values.forEach(value => {
            if (!currentFilters.includes(value)) {
                toggleFilter(type, value);
            }
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                {/* Summary Card */}
                <ZonesSummaryCard
                    totalCount={zones.length}
                    filteredCount={filteredZones.length}
                    title="Управление зонами"
                    description="Выберите зоны для создания заявки на бронирование от имени поставщика"
                />

                {/* Supplier Selection */}
                <div className="mb-4">
                    <label
                        htmlFor="supplier-select"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Выберите поставщика:
                    </label>
                    <Select
                        onValueChange={setSelectedSupplierInn}
                        value={selectedSupplierInn || undefined}
                    >
                        <SelectTrigger
                            id="supplier-select"
                            className="w-full md:w-1/2 lg:w-1/4"
                        >
                            <SelectValue placeholder="Выберите поставщика" />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map(supplier => (
                                <SelectItem
                                    key={supplier.id}
                                    value={supplier.id}
                                >
                                    {supplier.supplierName || supplier.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Category Selection - Added this section */}
                <div className="mb-4">
                    <label
                        htmlFor="category-select"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Выберите категорию:
                    </label>
                    <Select
                        onValueChange={setCategoryFilter}
                        value={categoryFilter || undefined}
                    >
                        <SelectTrigger
                            id="category-select"
                            className="w-full md:w-1/2 lg:w-1/4"
                        >
                            <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(category => (
                                <SelectItem
                                    key={category}
                                    value={category}
                                >
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Filters and Zone Table - Rendered conditionally */}
                {selectedSupplierInn && categoryFilter && (
                    <>
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
                            role="CATEGORY_MANAGER"
                            className="mb-6"
                            selectedCategory={categoryFilter}
                        />

                        <ZonesTable
                            zones={filteredZones}
                            onZoneSelect={handleZoneSelection}
                            onCreateBooking={handleCreateBooking}
                            selectedZones={selectedZones}
                            showActions={false}
                            isLoading={isLoading}
                            role="CATEGORY_MANAGER"
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSortChange={handleSortChange}
                        />
                    </>
                )}
            </main>
        </div>
    );
}
