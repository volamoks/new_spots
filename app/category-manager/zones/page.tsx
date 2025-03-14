'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCategoryManagerZones } from '@/lib/stores/zones/categoryManagerZonesStore';
import { ZoneStatus } from '@/types/zone';
import { ZonesSummaryCard } from '@/app/components/zones/ZonesSummaryCard';
import { ZonesFilters } from '@/app/components/zones/ZonesFilters';
import { ZonesTable } from '@/app/components/zones/ZonesTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, ShoppingCart, Store } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function CategoryManagerZonesPage() {
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
    resetFilters,
    fetchZones,
    refreshZones,
    selectedZones,
    selectedSupplier,
    selectZone,
    deselectZone,
    clearSelectedZones,
    selectSupplier,
    createBooking,
    userCategory,
  } = useCategoryManagerZones();

  // Загружаем зоны при инициализации
  useEffect(() => {
    if (session) {
      fetchZones("CATEGORY_MANAGER");
    }
  }, [session, fetchZones]);

  // Обработчик выбора зоны
  const handleZoneSelection = (zoneId: string) => {
    if (selectedZones.includes(zoneId)) {
      deselectZone(zoneId);
    } else {
      selectZone(zoneId);
    }
  };

  // Обработчик создания бронирования
  const handleCreateBooking = async () => {
    if (selectedZones.length === 0 || !selectedSupplier) return;
    
    await createBooking(selectedSupplier);
  };

  // Обработчик изменения фильтра
  const handleFilterChange = (type: 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier', values: string[]) => {
    // Сбрасываем текущие фильтры этого типа
    const currentFilters = 
      type === 'city' ? cityFilters :
      type === 'market' ? marketFilters :
      type === 'macrozone' ? macrozoneFilters :
      type === 'equipment' ? equipmentFilters :
      supplierFilters;
    
    // Удаляем старые фильтры
    currentFilters.forEach(value => {
      if (!values.includes(value)) {
        removeFilter(type, value);
      }
    });
    
    // Добавляем новые фильтры
    values.forEach(value => {
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
          title="Управление зонами категории"
          description="Выберите зоны для создания заявки на бронирование от имени поставщика"
        />
        
        {/* Карточка категории и поставщика */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Информация о категории</CardTitle>
            <CardDescription>
              Ваша категория и выбор поставщика для бронирования
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div>
                <p className="text-sm font-medium mb-1">Ваша категория:</p>
                <Badge variant="outline" className="text-sm">
                  {userCategory || "Категория не указана"}
                </Badge>
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Выберите поставщика для бронирования:</p>
                <Select
                  value={selectedSupplier || ""}
                  onValueChange={(value) => selectSupplier(value)}
                >
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Выберите поставщика" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueSuppliers.length > 0 ? (
                      uniqueSuppliers.map((supplier) => (
                        <SelectItem key={supplier} value={supplier}>
                          {supplier}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        Нет доступных поставщиков
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Карточка выбранных зон */}
        {selectedZones.length > 0 && (
          <Card className="mb-6 border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5 text-primary" />
                Выбранные зоны: {selectedZones.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedZones.map(zoneId => {
                  const zone = zones.find(z => z.id === zoneId);
                  return (
                    <div 
                      key={zoneId} 
                      className="bg-primary-50 text-primary-700 px-2 py-1 rounded-md text-sm flex items-center"
                    >
                      <span>{zone?.uniqueIdentifier || zoneId}</span>
                      <button 
                        onClick={() => deselectZone(zoneId)}
                        className="ml-2 text-primary-500 hover:text-primary-700"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={clearSelectedZones}
                >
                  Очистить выбор
                </Button>
                <Button 
                  onClick={handleCreateBooking}
                  disabled={selectedZones.length === 0 || !selectedSupplier || isLoading}
                >
                  <Store className="mr-2 h-4 w-4" />
                  Создать бронирование для поставщика
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
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
          role="CATEGORY_MANAGER"
          className="mb-6"
        />
        
        {/* Таблица зон с возможностью выбора */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Выбор</th>
                    <th className="p-2 text-left">ID</th>
                    <th className="p-2 text-left">Город</th>
                    <th className="p-2 text-left">Магазин</th>
                    <th className="p-2 text-left">Макрозона</th>
                    <th className="p-2 text-left">Оборудование</th>
                    <th className="p-2 text-left">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredZones.length > 0 ? (
                    filteredZones.map((zone) => (
                      <tr 
                        key={zone.id} 
                        className={`border-b hover:bg-gray-50 cursor-pointer ${
                          selectedZones.includes(zone.id) ? 'bg-primary-50' : ''
                        } ${
                          zone.status !== ZoneStatus.AVAILABLE ? 'opacity-50' : ''
                        }`}
                        onClick={() => zone.status === ZoneStatus.AVAILABLE && handleZoneSelection(zone.id)}
                      >
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedZones.includes(zone.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (zone.status === ZoneStatus.AVAILABLE) {
                                handleZoneSelection(zone.id);
                              }
                            }}
                            disabled={zone.status !== ZoneStatus.AVAILABLE}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="p-2 font-medium">{zone.uniqueIdentifier}</td>
                        <td className="p-2">{zone.city}</td>
                        <td className="p-2">{zone.market}</td>
                        <td className="p-2">{zone.mainMacrozone}</td>
                        <td className="p-2">{zone.equipment || "-"}</td>
                        <td className="p-2">
                          <Badge 
                            variant="outline" 
                            className={`
                              ${zone.status === ZoneStatus.AVAILABLE ? 'bg-green-100 text-green-800 border-green-300' : ''}
                              ${zone.status === ZoneStatus.BOOKED ? 'bg-blue-100 text-blue-800 border-blue-300' : ''}
                              ${zone.status === ZoneStatus.UNAVAILABLE ? 'bg-red-100 text-red-800 border-red-300' : ''}
                            `}
                          >
                            {zone.status === ZoneStatus.AVAILABLE ? 'Доступна' : 
                             zone.status === ZoneStatus.BOOKED ? 'Забронирована' : 
                             'Недоступна'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">
                        {zones.length === 0
                          ? "Зоны не найдены"
                          : "Нет зон, соответствующих фильтрам"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
