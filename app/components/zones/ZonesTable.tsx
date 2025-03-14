'use client';

import { useState } from "react";
import { Zone, ZoneStatus } from "@/types/zone";
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

interface ZonesTableProps {
  zones: Zone[];
  onStatusChange?: (zoneId: string, newStatus: ZoneStatus) => Promise<void>;
  showActions?: boolean;
  isLoading?: boolean;
  role?: string;
  className?: string;
}

export function ZonesTable({
  zones,
  onStatusChange,
  showActions = true,
  isLoading = false,
  role = "DMP_MANAGER",
  className = "",
}: ZonesTableProps) {
  // Состояние для пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Если роль - поставщик, скрываем действия
  const shouldShowActions = showActions && role !== "SUPPLIER";

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

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Город</TableHead>
              <TableHead>Магазин</TableHead>
              <TableHead>Макрозона</TableHead>
              <TableHead>Оборудование</TableHead>
              <TableHead>Статус</TableHead>
              {shouldShowActions && <TableHead>Действия</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentZones.length > 0 ? (
              currentZones.map((zone) => (
                <TableRow key={zone.id}>
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
                  {shouldShowActions && (
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
                  colSpan={shouldShowActions ? 7 : 6}
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
