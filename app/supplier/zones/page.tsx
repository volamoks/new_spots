'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSupplierZones } from '@/lib/stores/zones/supplierZonesStore';
import { ZoneStatus } from '@/types/zone';
import { ZonesSummaryCard } from '@/app/components/zones/ZonesSummaryCard';
import { ZonesFilters } from '@/app/components/zones/ZonesFilters';
import { ZonesTable } from '@/app/components/zones/ZonesTable';

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
    
    try {
      await createBooking(selectedZones);
      setSelectedZones([]);
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
          title="Доступные зоны для бронирования"
          description="Выберите зоны для создания заявки на бронирование"
        />
        
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
        <ZonesTable
          zones={filteredZones}
          onZoneSelect={handleZoneSelection}
          onCreateBooking={handleCreateBooking}
          selectedZones={selectedZones}
          showActions={false}
          isLoading={isLoading}
          role="SUPPLIER"
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
      </main>
    </div>
  );
}
