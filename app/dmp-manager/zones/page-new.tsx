'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useDmpManagerZones } from '@/lib/stores/zones/dmpManagerZonesStore';
import { ZoneStatus } from '@/types/zone';
import { ZonesSummaryCard } from '@/app/components/zones/ZonesSummaryCard';
import { ZonesFilters } from '@/app/components/zones/ZonesFilters';
import { ZonesTable } from '@/app/components/zones/ZonesTable';

export default function DmpManagerZonesPage() {
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
    changeZoneStatus,
    refreshZones,
  } = useDmpManagerZones();

  // Загружаем зоны при инициализации
  useEffect(() => {
    if (session) {
      fetchZones("DMP_MANAGER");
    }
  }, [session, fetchZones]);

  // Обработчик изменения статуса зоны
  const handleStatusChange = async (zoneId: string, newStatus: ZoneStatus) => {
    await changeZoneStatus(zoneId, newStatus);
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
          role="DMP_MANAGER"
          className="mb-6"
        />
        
        {/* Таблица зон */}
        <ZonesTable
          zones={filteredZones}
          onStatusChange={handleStatusChange}
          showActions={true}
          isLoading={isLoading}
          role="DMP_MANAGER"
        />
      </main>
    </div>
  );
}
