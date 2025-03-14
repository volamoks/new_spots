'use client';

import { ZoneStatus } from "@/types/zone";
import { Button } from "@/components/ui/button";

interface ZoneStatusActionsProps {
  zoneId: string;
  currentStatus: ZoneStatus | string;
  onStatusChange: (zoneId: string, newStatus: ZoneStatus) => Promise<void>;
  isDisabled?: boolean;
  className?: string;
}

export function ZoneStatusActions({
  zoneId,
  currentStatus,
  onStatusChange,
  isDisabled = false,
  className = "",
}: ZoneStatusActionsProps) {
  // Нормализуем статус к типу ZoneStatus
  const normalizedStatus = 
    typeof currentStatus === 'string' && currentStatus in ZoneStatus 
      ? currentStatus as ZoneStatus 
      : ZoneStatus.UNAVAILABLE;

  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      <Button
        onClick={() => onStatusChange(zoneId, ZoneStatus.AVAILABLE)}
        disabled={normalizedStatus === ZoneStatus.AVAILABLE || isDisabled}
        variant="ghost"
        size="sm"
        className={`text-xs px-2 py-1 h-auto ${
          normalizedStatus === ZoneStatus.AVAILABLE || isDisabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-green-100 text-green-800 hover:bg-green-200'
        }`}
      >
        Доступна
      </Button>
      <Button
        onClick={() => onStatusChange(zoneId, ZoneStatus.BOOKED)}
        disabled={normalizedStatus === ZoneStatus.BOOKED || isDisabled}
        variant="ghost"
        size="sm"
        className={`text-xs px-2 py-1 h-auto ${
          normalizedStatus === ZoneStatus.BOOKED || isDisabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        }`}
      >
        Забронирована
      </Button>
      <Button
        onClick={() => onStatusChange(zoneId, ZoneStatus.UNAVAILABLE)}
        disabled={normalizedStatus === ZoneStatus.UNAVAILABLE || isDisabled}
        variant="ghost"
        size="sm"
        className={`text-xs px-2 py-1 h-auto ${
          normalizedStatus === ZoneStatus.UNAVAILABLE || isDisabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-red-100 text-red-800 hover:bg-red-200'
        }`}
      >
        Недоступна
      </Button>
    </div>
  );
}
