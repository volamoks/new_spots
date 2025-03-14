'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSupplierZones } from '@/lib/stores/zones/supplierZonesStore';
import { ZoneStatus } from '@/types/zone';
import { ZonesSummaryCard } from '@/app/components/zones/ZonesSummaryCard';
import { ZonesFilters } from '@/app/components/zones/ZonesFilters';
import { ZonesTable } from '@/app/components/zones/ZonesTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ShoppingCart } from 'lucide-react';

export default function SupplierZonesPage() {
  const { data: session } = useSession();
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  
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
    createBooking,
    refreshZones,
  } = useSupplierZones();

  // Загружаем зоны при инициализации
  useEffect(() => {
    if (session) {
      fetchZones("SUPPLIER");
    }
  }, [session, fetchZones]);

  // Обработчик выбора зоны
  const handleZoneSelection = (zoneId: string) => {
    setSelectedZones(prev =>
      prev.includes(zoneId)
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  };

  // Обработчик создания бронирования
  const handleCreateBooking = async () => {
    if (selectedZones.length === 0) return;
    
    await createBooking(selectedZones);
    setSelectedZones([]);
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
          title="Доступные зоны для бронирования"
          description="Выберите зоны для создания заявки на бронирование"
        />
        
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
                        onClick={() => handleZoneSelection(zoneId)}
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
                  onClick={() => setSelectedZones([])}
                >
                  Очистить выбор
                </Button>
                <Button 
                  onClick={handleCreateBooking}
                  disabled={selectedZones.length === 0 || isLoading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Создать бронирование
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
          role="SUPPLIER"
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
                  </tr>
                </thead>
                <tbody>
                  {filteredZones.length > 0 ? (
                    filteredZones.map((zone) => (
                      <tr 
                        key={zone.id} 
                        className={`border-b hover:bg-gray-50 cursor-pointer ${
                          selectedZones.includes(zone.id) ? 'bg-primary-50' : ''
                        }`}
                        onClick={() => handleZoneSelection(zone.id)}
                      >
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedZones.includes(zone.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleZoneSelection(zone.id);
                            }}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="p-2 font-medium">{zone.uniqueIdentifier}</td>
                        <td className="p-2">{zone.city}</td>
                        <td className="p-2">{zone.market}</td>
                        <td className="p-2">{zone.mainMacrozone}</td>
                        <td className="p-2">{zone.equipment || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
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
