'use client';

import { useState } from 'react';
import { Zone, ZoneStatus } from '@/types/zone';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ZoneStatusBadge } from "./ZoneStatusBadge";
import { ZoneStatusActions } from "./ZoneStatusActions";
import { ZonePagination } from "./ZonePagination";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, CheckCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ZonesTableProps {
  zones: Zone[];
  onStatusChange?: (zoneId: string, newStatus: ZoneStatus) => Promise<void>;
  onZoneSelect?: (zoneId: string) => void;
  onCreateBooking?: (zoneIds: string[]) => Promise<void>;
  onSelectSupplier?: (supplierId: string) => void;
  selectedZones?: string[];
  selectedSupplier?: string | null;
  uniqueSuppliers?: string[];
  showActions?: boolean;
  isLoading?: boolean;
  role?: string;
  className?: string;
  sortField?: keyof Zone | null;
  sortDirection?: 'asc' | 'desc' | null;
  onSortChange?: (field: keyof Zone, direction: 'asc' | 'desc' | null) => void;
}

export function ZonesTable({
  zones,
  onStatusChange,
  onZoneSelect,
  onCreateBooking,
  onSelectSupplier,
  selectedZones = [],
  selectedSupplier = null,
  uniqueSuppliers = [],
  showActions = true,
  isLoading = false,
  role = "DMP_MANAGER",
  className = "",
  sortField = null,
  sortDirection = null,
  onSortChange,
}: ZonesTableProps) {
  // Состояние для пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Определяем, какие действия показывать в зависимости от роли
  const isDmpManager = role === "DMP_MANAGER";
  const isSupplier = role === "SUPPLIER";
  const isCategoryManager = role === "CATEGORY_MANAGER";
  
  // Определяем, показывать ли чекбоксы для выбора зон
  const showSelectionColumn = isSupplier || isCategoryManager;
  
  // Определяем, показывать ли действия со статусами
  const showStatusActions = isDmpManager && showActions;

  // Вычисляем общее количество страниц
  const totalPages = Math.max(1, Math.ceil(zones.length / itemsPerPage));

  // Получаем текущую страницу зон
  const currentZones = zones.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Обработчик изменения статуса зоны
  const handleStatusChange = async (zoneId: string, newStatus: ZoneStatus) => {
    if (onStatusChange) {
      await onStatusChange(zoneId, newStatus);
    }
  };

  // Обработчик выбора зоны
  const handleZoneSelect = (zoneId: string) => {
    if (onZoneSelect) {
      onZoneSelect(zoneId);
    }
  };

  // Обработчик создания бронирования
  const handleCreateBooking = async () => {
    if (onCreateBooking && selectedZones.length > 0) {
      await onCreateBooking(selectedZones);
    }
  };

  // Обработчик изменения сортировки
  const handleSortChange = (field: keyof Zone) => {
    if (!onSortChange) return;

    let newDirection: 'asc' | 'desc' | null = 'asc';
    
    if (sortField === field) {
      if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (sortDirection === 'desc') {
        newDirection = null;
      }
    }
    onSortChange(field, newDirection);
  };

    // Функция для отображения иконки сортировки
    const getSortIcon = (field: keyof Zone) => {
      if (sortField !== field) {
        return <ArrowUpDown className="ml-2 h-4 w-4" />;
      }

      if (sortDirection === 'asc') {
        return <ArrowUp className="ml-2 h-4 w-4" />;
      }

      if (sortDirection === 'desc') {
        return <ArrowDown className="ml-2 h-4 w-4" />;
      }

      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    };

  // Функция для создания заголовка с сортировкой
    const SortableHeader = ({ field, children }: { field: keyof Zone, children: React.ReactNode }) => (
    <TableHead>
      <div
        className="flex items-center cursor-pointer"
        onClick={() => handleSortChange(field)}
      >
        {children}
        {onSortChange && getSortIcon(field)}
      </div>
    </TableHead>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Панель действий для выбранных зон */}
      {showSelectionColumn && selectedZones.length > 0 && (
        <div className="bg-primary-50 p-4 rounded-md mb-4 border border-primary-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="font-medium">Выбрано зон: {selectedZones.length}</p>
              <p className="text-sm text-gray-500">
                {isSupplier 
                  ? "Выберите зоны для создания заявки на бронирование" 
                  : "Выберите зоны и поставщика для создания заявки на бронирование"}
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
              {isCategoryManager && (
                <Select
                  value={selectedSupplier || ""}
                  onValueChange={(value) => onSelectSupplier && onSelectSupplier(value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Выберите поставщика" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueSuppliers.map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Button 
                onClick={handleCreateBooking}
                disabled={
                  selectedZones.length === 0 || 
                  isLoading || 
                  (isCategoryManager && !selectedSupplier)
                }
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Создать бронирование
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {showSelectionColumn && (
                <TableHead className="w-[50px]">Выбор</TableHead>
              )}
              <SortableHeader field="uniqueIdentifier">ID</SortableHeader>
              <SortableHeader field="city">Город</SortableHeader>
              <SortableHeader field="market">Магазин</SortableHeader>
              <SortableHeader field="mainMacrozone">Макрозона</SortableHeader>
              <SortableHeader field="equipment">Оборудование</SortableHeader>
              <SortableHeader field="status">Статус</SortableHeader>
              {showStatusActions && <TableHead>Действия</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentZones.length > 0 ? (
              currentZones.map((zone) => (
                <TableRow 
                  key={zone.id}
                  className={showSelectionColumn && selectedZones.includes(zone.id) ? "bg-primary-50" : ""}
                  onClick={() => showSelectionColumn && zone.status === ZoneStatus.AVAILABLE && handleZoneSelect(zone.id)}
                  style={showSelectionColumn ? { cursor: 'pointer' } : {}}
                >
                  {showSelectionColumn && (
                    <TableCell>
                      <Checkbox
                        checked={selectedZones.includes(zone.id)}
                        onCheckedChange={() => handleZoneSelect(zone.id)}
                        disabled={zone.status !== ZoneStatus.AVAILABLE}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    {zone.uniqueIdentifier}
                  </TableCell>
                  <TableCell>{zone.city}</TableCell>
                  <TableCell>{zone.market}</TableCell>
                  <TableCell>{zone.mainMacrozone}</TableCell>
                  <TableCell>{zone.equipment || "-"}</TableCell>
                  <TableCell>
                    <ZoneStatusBadge status={zone.status} />
                  </TableCell>
                  {showStatusActions && (
                    <TableCell>
                      <ZoneStatusActions
                        zoneId={zone.id}
                        currentStatus={zone.status}
                        onStatusChange={handleStatusChange}
                        isDisabled={isLoading}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={showSelectionColumn ? (showStatusActions ? 8 : 7) : (showStatusActions ? 7 : 6)}
                  className="text-center py-4 text-gray-500"
                >
                  {zones.length === 0
                    ? "Зоны не найдены"
                    : "Нет зон, соответствующих фильтрам"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ZonePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalItems={zones.length}
        filteredItems={zones.length}
        isDisabled={isLoading}
      />
    </div>
  );
}
