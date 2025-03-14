'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCategoryManagerZones } from '@/lib/stores/zones/categoryManagerZonesStore';
import { ZoneStatus } from '@/types/zone';
import { ZonesSummaryCard } from '@/app/components/zones/ZonesSummaryCard';
import { ZonesFilters } from '@/app/components/zones/ZonesFilters';
import { ZonesTable } from '@/app/components/zones/ZonesTable';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
    sortField,
    sortDirection,
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
    setSorting,
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
    
    try {
      await createBooking(selectedSupplier);
    } catch (error) {
      console.error('Ошибка при создании бронирования:', error);
    }
  };

  // Обработчик изменения сортировки
  const handleSortChange = (field: string, direction: 'asc' | 'desc' | null) => {
    setSorting(field, direction);
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
            </div>
          </CardContent>
        </Card>
        
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
        <ZonesTable
          zones={filteredZones}
          onZoneSelect={handleZoneSelection}
          onCreateBooking={handleCreateBooking}
          onSelectSupplier={selectSupplier}
          selectedZones={selectedZones}
          selectedSupplier={selectedSupplier}
          uniqueSuppliers={uniqueSuppliers}
          showActions={false}
          isLoading={isLoading}
          role="CATEGORY_MANAGER"
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
      </main>
    </div>
  );
}
