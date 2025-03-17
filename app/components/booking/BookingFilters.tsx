import React, { useMemo } from 'react';
import { useFilterStore } from '@/lib/stores/filterStore';
import { useZonesStore } from '@/lib/stores/zonesStore';
import { getCorrespondingMacrozones } from '@/lib/filterData';
import { SimpleZoneFilterDropdown } from '@/app/components/zones/SimpleZoneFilterDropdown';

interface Props {
    selectedCategory: string;
}
import { ZoneSelectedFilters } from '@/app/components/zones/ZoneSelectedFilters';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const BookingFilters = ({ selectedCategory }: Props) => {
    const {
        searchTerm,
        cityFilters,
        marketFilters,
        macrozoneFilters,
        equipmentFilters,
        supplierFilters,
        debouncedSetSearchTerm,
        toggleFilter,
        removeFilter,
        resetFilters,
    } = useFilterStore();

    const { uniqueCities, uniqueMarkets, uniqueEquipments, isLoading } = useZonesStore();

    const cityOptions = Array.isArray(uniqueCities)
        ? uniqueCities.map(city => ({ value: city, label: city }))
        : [];
    const marketOptions = Array.isArray(uniqueMarkets)
        ? uniqueMarkets.map(market => ({ value: market, label: market }))
        : [];
    const macrozoneOptions = useMemo(() => {
        const macrozones = getCorrespondingMacrozones(selectedCategory);
        return macrozones.map(macrozone => ({
            value: macrozone,
            label: macrozone,
        }));
    }, [selectedCategory]);
    const equipmentOptions = Array.isArray(uniqueEquipments)
        ? uniqueEquipments.map(equipment => ({
              value: equipment,
              label: equipment,
          }))
        : [];
    // const supplierOptions = Array.isArray(uniqueSuppliers)
    //     // ? uniqueSuppliers.map(supplier => ({
    //     //       value: supplier,
    //     //       label: supplier,
    //     //   }))
    //     // : [];

    const handleFilterChange = (
        type: 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier',
        values: string[],
    ) => {
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

        currentFilters.forEach(value => {
            if (!values.includes(value)) {
                removeFilter(type, value);
            }
        });

        values.forEach(value => {
            if (!currentFilters.includes(value)) {
                toggleFilter(type, value);
            }
        });
    };

    return (
        <Card className="mb-6">
            <CardContent className="p-4 space-y-4">
                <label className="block text-m font-medium mb-2 mt-4">Выберите фильтры</label>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder="Поиск по городу, магазину, макрозоне..."
                            value={searchTerm}
                            onChange={e => debouncedSetSearchTerm(e.target.value)}
                            disabled={isLoading}
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <SimpleZoneFilterDropdown
                        title="Город"
                        options={cityOptions}
                        selected={cityFilters}
                        onChange={(values: string[]) => handleFilterChange('city', values)}
                        isDisabled={isLoading}
                    />
                    <SimpleZoneFilterDropdown
                        title="Магазин"
                        options={marketOptions}
                        selected={marketFilters}
                        onChange={(values: string[]) => handleFilterChange('market', values)}
                        isDisabled={isLoading}
                    />
                    <SimpleZoneFilterDropdown
                        title={`Макрозона${
                            macrozoneFilters.length > 0 ? ` (${macrozoneFilters.length})` : ''
                        }`}
                        options={macrozoneOptions}
                        selected={macrozoneFilters}
                        onChange={(values: string[]) => handleFilterChange('macrozone', values)}
                        isDisabled={isLoading}
                    />
                    <SimpleZoneFilterDropdown
                        title="Оборудование"
                        options={equipmentOptions}
                        selected={equipmentFilters}
                        onChange={(values: string[]) => handleFilterChange('equipment', values)}
                        isDisabled={isLoading}
                    />
                    {/* <SimpleZoneFilterDropdown
                        title="Поставщик"
                        options={supplierOptions}
                        selected={supplierFilters}
                        onChange={(values: string[]) => handleFilterChange('supplier', values)}
                        isDisabled={isLoading}
                    /> */}
                </div>
                <div className="mb-4">
                    <ZoneSelectedFilters
                        filters={{
                            city: cityFilters,
                            market: marketFilters,
                            macrozone: macrozoneFilters,
                            equipment: equipmentFilters,
                        }}
                        labels={{
                            city: 'Город',
                            market: 'Магазин',
                            macrozone: 'Макрозона',
                            equipment: 'Оборудование',
                        }}
                        onRemove={removeFilter}
                        className="mt-2"
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={resetFilters}
                    disabled={isLoading}
                    className="whitespace-nowrap"
                >
                    Сбросить фильтры
                </Button>
            </CardContent>
        </Card>
    );
};

export default BookingFilters;
