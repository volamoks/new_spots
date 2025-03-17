'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useZonesStore } from '@/lib/stores/zonesStore';
import { useFilterStore } from '@/lib/stores/filterStore';
import { useBookingStore } from '@/lib/stores/bookingStore';
import { Zone } from '@/types/zone';
import { getCorrespondingMacrozones } from '@/lib/filterData';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SimpleZoneFilterDropdown } from '@/app/components/zones/SimpleZoneFilterDropdown';
import { ZoneSelectedFilters } from '@/app/components/zones/ZoneSelectedFilters';
import { RefreshCw } from "lucide-react";
import { ZonePagination } from '@/app/components/zones/ZonePagination';

export default function SupplierZonesNewPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState<'category' | 'zones'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

    // Состояние для пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Получаем состояние и методы из сторов
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
    setCurrentPage,
    setItemsPerPage
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
        applyFilters
    } = useFilterStore();
    const {
        selectedZones,
        addSelectedZone,
        removeSelectedZone,
        clearSelectedZones,
        createBooking
    } = useBookingStore();

  // Получаем категорию поставщика и соответствующие макрозоны
  const supplierCategory = session?.user?.category || '';
    const correspondingMacrozones = useMemo(
        () => getCorrespondingMacrozones(supplierCategory),
        [supplierCategory]
    );

    // Fetch zones when the component mounts or the session changes
    useEffect(() => {
        if (session) {
            fetchZones('SUPPLIER');
        }
    }, [session, fetchZones]);

  const filteredZones = applyFilters(zones);

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
        if (selectedZones.length === 0) return;

        try {
            await createBooking(selectedZones);
            clearSelectedZones()
        } catch (error) {
            console.error('Error creating booking:', error);
        }
    };

    // Filter change handler
    const handleFilterChange = (
        type: 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier',
        values: string[]
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
  
      // Map unique values to dropdown options
    const cityOptions = uniqueCities.map((city) => ({ value: city, label: city }));
    const marketOptions = uniqueMarkets.map((market) => ({ value: market, label: market }));
    const macrozoneOptions = uniqueMacrozones.map((macrozone) => ({ value: macrozone, label: macrozone }));
    const equipmentOptions = uniqueEquipments.map((equipment) => ({ value: equipment, label: equipment }));

      // Calculate current zones based on pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentZones = filteredZones.slice(startIndex, endIndex);

    // Select all zones on the current page
    const handleSelectAllOnPage = (checked: boolean) => {
      const newSelectedZones = [...selectedZones];
      currentZones.forEach(zone => {
        if (!newSelectedZones.includes(zone.id)) {
          newSelectedZones.push(zone.id);
        }
      });
      
      if(checked) {
        setSelectedZones(newSelectedZones)
      } else {
        currentZones.forEach(zone => {
          removeSelectedZone(zone.id)
        })
      }
    };
  
    // Check if all zones on the current page are selected
    const areAllOnPageSelected = currentZones.length > 0 && currentZones.every((zone) => selectedZones.includes(zone.id));

    // Get categories from filterData.ts
    const categories = useMemo(() => {
        const { categoryData } = require('@/lib/filterData');
        return categoryData.map((item: { category: string }) => item.category);
    }, []);

      // Category selection handler
    const handleCategorySelect = (category: string): void => {
        console.log('Selected category:', category);
        setSelectedCategory(category);
        setStep('zones');
    };

        {step === 'category' ? (
          /* Step 1: Category Selection */
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Шаг 1: Выберите категорию товара</h2>
              <p className="text-gray-600 mb-6">
                Выберите категорию товара, чтобы увидеть доступные зоны для бронирования.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category: string) => (
                  <div
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`p-4 rounded-md border cursor-pointer hover:bg-gray-100 ${
                      selectedCategory === category 
                        ? 'bg-red-100 border-red-500 text-red-700' 
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    {category}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Step 2: Zone Selection */
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Шаг 2: Выберите зоны для бронирования</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setStep('category')}
                  className="ml-4"
                >
                  Вернуться к выбору категории
                </Button>
              </div>
              {selectedCategory && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-blue-800 font-medium">Выбранная категория: {selectedCategory}</p>
                  <p className="text-blue-600 text-sm mt-1">
                    Доступные макрозоны: {getCorrespondingMacrozones(selectedCategory).length > 0
                      ? getCorrespondingMacrozones(selectedCategory).join(', ')
                      : 'Нет доступных макрозон'}
                  </p>
                </div>
              )}
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4 space-y-4">
                {/* Search and Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Поиск по городу, магазину, макрозоне..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={resetFilters}
                      disabled={isLoading}
                      className="whitespace-nowrap"
                    >
                      Сбросить фильтры
                    </Button>
                    <Button
                      onClick={refreshZones}
                      disabled={isLoading}
                      className="whitespace-nowrap"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Обновить
                    </Button>
                    <Button
                      onClick={handleCreateBooking}
                      disabled={isLoading || selectedZones.length === 0}
                      className="whitespace-nowrap"
                    >
                      Создать бронирование ({selectedZones.length})
                    </Button>
                  </div>
                </div>

                {/* Filter Dropdowns */}
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
                    title="Макрозона"
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
                </div>
              </CardContent>
            </Card>

            {/* Selected Filters */}
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

            {/* Zone Table */}
            <div className="bg-white rounded-md shadow overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <Checkbox
                          checked={areAllOnPageSelected}
                          onCheckedChange={handleSelectAllOnPage}
                          disabled={isLoading || currentZones.length === 0}
                        />
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Город
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Магазин
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Макрозона
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Оборудование
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                          Загрузка...
                        </td>
                      </tr>
                    ) : currentZones.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                          Нет доступных зон
                        </td>
                      </tr>
                    ) : (
                      currentZones.map((zone) => (
                        <tr key={zone.id} className="hover

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-red-600">Доступные зоны для бронирования</h1>
          <p className="text-gray-600">Выберите зоны для создания заявки на бронирование</p>
        </div>

        {step === 'category' ? (
          /* Шаг 1: Выбор категории */
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Шаг 1: Выберите категорию товара</h2>
              <p className="text-gray-600 mb-6">
                Выберите категорию товара, чтобы увидеть доступные зоны для бронирования.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category: string) => (
                  <div
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`p-4 rounded-md border cursor-pointer hover:bg-gray-100 ${
                      selectedCategory === category 
                        ? 'bg-red-100 border-red-500 text-red-700' 
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    {category}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Шаг 2: Выбор зон */
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Шаг 2: Выберите зоны для бронирования</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setStep('category')}
                  className="ml-4"
                >
                  Вернуться к выбору категории
                </Button>
              </div>
              
              {selectedCategory && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-blue-800 font-medium">Выбранная категория: {selectedCategory}</p>
                  <p className="text-blue-600 text-sm mt-1">
                    Доступные макрозоны: {getCorrespondingMacrozones(selectedCategory).length > 0 
                      ? getCorrespondingMacrozones(selectedCategory).join(', ') 
                      : 'Нет доступных макрозон'}
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    Всего зон в системе: {zones.length}
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    Отфильтровано зон: {zonesToDisplay.length}
                  </p>
                </div>
              )}
            </div>
            
            {/* Фильтры */}
            <Card className="mb-6">
              <CardContent className="p-4 space-y-4">
                {/* Поиск и кнопки действий */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Поиск по городу, магазину, макрозоне..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={resetFilters}
                      disabled={isLoading}
                      className="whitespace-nowrap"
                    >
                      Сбросить фильтры
                    </Button>
                    <Button
                      onClick={refreshZones}
                      disabled={isLoading}
                      className="whitespace-nowrap bg-red-600 hover:bg-red-700"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Обновить
                    </Button>
                    <Button
                      onClick={handleCreateBooking}
                      disabled={isLoading || selectedZones.length === 0}
                      className="whitespace-nowrap bg-red-600 hover:bg-red-700"
                    >
                      Создать бронирование ({selectedZones.length})
                    </Button>
                  </div>
                </div>

                {/* Выпадающие списки для фильтров */}
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
                    title={`Макрозона${macrozoneFilters.length > 0 ? ` (${macrozoneFilters.length})` : ''}`}
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
                </div>
              </CardContent>
            </Card>
            
            {/* Выбранные фильтры */}
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
            
            {/* Таблица зон */}
            <div className="bg-white rounded-md shadow overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Checkbox 
                            checked={areAllOnPageSelected}
                            onCheckedChange={handleSelectAllOnPage}
                            disabled={isLoading || currentZones.length === 0}
                            className="mr-2"
                          />
                          Выбор
                        </div>
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Город
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Магазин
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Макрозона
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Оборудование
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-500">
                          Загрузка...
                        </td>
                      </tr>
                    ) : currentZones.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-500">
                          Нет доступных зон
                        </td>
                      </tr>
                    ) : (
                      currentZones.map((zone) => (
                        <tr key={zone.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap">
                            <Checkbox 
                              checked={selectedZones.includes(zone.uniqueIdentifier)}
                              onCheckedChange={() => handleZoneSelection(zone.uniqueIdentifier)}
                            />
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {zone.uniqueIdentifier}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {zone.city}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {zone.market}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {zone.mainMacrozone}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {zone.equipment}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Доступна
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Пагинация */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  Показано {Math.min(zonesToDisplay.length, startIndex + 1)} - {Math.min(zonesToDisplay.length, endIndex)} из {zonesToDisplay.length} зон
                </p>
              </div>
              
              <ZonePagination
                currentPage={currentPage}
                totalItems={zones.length}
                filteredItems={zonesToDisplay.length}
                totalPages={Math.ceil(zonesToDisplay.length / itemsPerPage)}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
