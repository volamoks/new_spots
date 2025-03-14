'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ZoneFilterTabs } from "./ZoneFilterTabs";
import { ZoneSearchInput } from "./ZoneSearchInput";
import { SimpleZoneFilterDropdown } from "./SimpleZoneFilterDropdown";
import { ZoneSelectedFilters } from "./ZoneSelectedFilters";
import { RefreshCw } from "lucide-react";
import { getCorrespondingMacrozones } from '@/lib/filterData'; // Import

interface ZonesFiltersProps {
  // Состояние фильтров
  activeTab: string;
  searchTerm: string;
  cityFilters: string[];
  marketFilters: string[];
  macrozoneFilters: string[];
  equipmentFilters: string[];
  supplierFilters: string[];

  // Уникальные значения для фильтров
  uniqueCities: string[];
  uniqueMarkets: string[];
  uniqueMacrozones: string[];
  uniqueEquipments: string[];
  uniqueSuppliers: string[];

  // Обработчики
  onTabChange: (tab: string) => void;
  onSearchChange: (term: string) => void;
  onFilterChange: (type: 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier', values: string[]) => void;
  onFilterRemove: (type: 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier', value: string) => void;
  onResetFilters: () => void;
  onRefresh: () => void;

  // Дополнительные параметры
  isLoading?: boolean;
  role?: string;
  className?: string;
  selectedCategory?: string | null; // Add selectedCategory prop
}

export function ZonesFilters({
  // Состояние фильтров
  activeTab,
  searchTerm,
  cityFilters,
  marketFilters,
  macrozoneFilters,
  equipmentFilters,
  supplierFilters,

  // Уникальные значения для фильтров
  uniqueCities,
  uniqueMarkets,
  uniqueMacrozones,
  uniqueEquipments,
  uniqueSuppliers,

  // Обработчики
  onTabChange,
  onSearchChange,
  onFilterChange,
  onFilterRemove,
  onResetFilters,
  onRefresh,

  // Дополнительные параметры
  isLoading = false,
  role = "DMP_MANAGER",
  className = "",
  selectedCategory = null, // Provide a default value
}: ZonesFiltersProps) {
    // Преобразуем массивы уникальных значений в формат для выпадающих списков
    const cityOptions = Array.isArray(uniqueCities) ? uniqueCities.map(city => ({ value: city, label: city })) : [];
    const marketOptions = Array.isArray(uniqueMarkets) ? uniqueMarkets.map(market => ({ value: market, label: market })) : [];

    // Generate macrozoneOptions based on selectedCategory
    const macrozoneOptions = selectedCategory
    ? getCorrespondingMacrozones(selectedCategory).map(macrozone => ({ value: macrozone, label: macrozone }))
    : (Array.isArray(uniqueMacrozones) ? uniqueMacrozones.map(macrozone => ({ value: macrozone, label: macrozone })) : []);


    const equipmentOptions = Array.isArray(uniqueEquipments) ? uniqueEquipments.map(equipment => ({ value: equipment, label: equipment })) : [];
    const supplierOptions = Array.isArray(uniqueSuppliers) ? uniqueSuppliers.map(supplier => ({ value: supplier, label: supplier })) : [];

  // Объект с выбранными фильтрами для компонента ZoneSelectedFilters
  const selectedFilters = {
    city: cityFilters,
    market: marketFilters,
    macrozone: macrozoneFilters,
    equipment: equipmentFilters,
    supplier: supplierFilters,
  };

  // Метки для типов фильтров
  const filterLabels = {
    city: 'Город',
    market: 'Магазин',
    macrozone: 'Макрозона',
    equipment: 'Оборудование',
    supplier: 'Поставщик',
  };

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        {/* Табы для фильтрации по статусу */}
        <ZoneFilterTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          isDisabled={isLoading}
          role={role}
          className="mb-4"
        />

        {/* Поиск и кнопки действий */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <ZoneSearchInput
              value={searchTerm}
              onChange={onSearchChange}
              isDisabled={isLoading}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onResetFilters}
              disabled={isLoading}
              className="whitespace-nowrap"
            >
              Сбросить фильтры
            </Button>
            <Button
              onClick={onRefresh}
              disabled={isLoading}
              className="whitespace-nowrap"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Обновить
            </Button>
          </div>
        </div>

        {/* Выпадающие списки для фильтров */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          <SimpleZoneFilterDropdown
            title="Город"
            options={cityOptions}
            selected={cityFilters}
            onChange={(values: string[]) => onFilterChange('city', values)}
            isDisabled={isLoading}
          />
          <SimpleZoneFilterDropdown
            title="Магазин"
            options={marketOptions}
            selected={marketFilters}
            onChange={(values: string[]) => onFilterChange('market', values)}
            isDisabled={isLoading}
          />
          <SimpleZoneFilterDropdown
            title="Макрозона"
            options={macrozoneOptions}
            selected={macrozoneFilters}
            onChange={(values: string[]) => onFilterChange('macrozone', values)}
            isDisabled={isLoading}
          />
          <SimpleZoneFilterDropdown
            title="Оборудование"
            options={equipmentOptions}
            selected={equipmentFilters}
            onChange={(values: string[]) => onFilterChange('equipment', values)}
            isDisabled={isLoading}
          />
          {role !== "SUPPLIER" && (
            <SimpleZoneFilterDropdown
              title="Поставщик"
              options={supplierOptions}
              selected={supplierFilters}
              onChange={(values: string[]) => onFilterChange('supplier', values)}
              isDisabled={isLoading}
            />
          )}
        </div>

        {/* Выбранные фильтры */}
        <ZoneSelectedFilters
          filters={selectedFilters}
          labels={filterLabels}
          onRemove={onFilterRemove}
        />
      </CardContent>
    </Card>
  );
}
