'use client';

import { ZoneStatus } from "@/types/zone";
import { Badge } from "@/components/ui/badge";

interface ZoneStatusBadgeProps {
  status: ZoneStatus | string;
  className?: string;
}

export function ZoneStatusBadge({ status, className = "" }: ZoneStatusBadgeProps) {
  // Преобразование статуса зоны для отображения
  const getStatusDisplay = (status: ZoneStatus | string) => {
    const statusMap: Record<string, string> = {
      [ZoneStatus.AVAILABLE]: 'Доступна',
      [ZoneStatus.BOOKED]: 'Забронирована',
      [ZoneStatus.UNAVAILABLE]: 'Недоступна',
    };
    return statusMap[status] || status;
  };

  // Получение класса статуса для стилизации
  const getStatusClass = (status: ZoneStatus | string) => {
    switch (status) {
      case ZoneStatus.AVAILABLE:
        return 'bg-green-100 text-green-800 border-green-300';
      case ZoneStatus.BOOKED:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case ZoneStatus.UNAVAILABLE:
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Нормализуем статус к типу ZoneStatus
  const normalizedStatus = 
    typeof status === 'string' && status in ZoneStatus 
      ? status as ZoneStatus 
      : ZoneStatus.UNAVAILABLE;

  return (
    <Badge 
      variant="outline" 
      className={`${getStatusClass(normalizedStatus)} ${className}`}
    >
      {getStatusDisplay(normalizedStatus)}
    </Badge>
  );
}
