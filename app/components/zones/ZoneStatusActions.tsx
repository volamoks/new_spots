'use client';

import { ZoneStatus } from '@/types/zone';
import { Button } from '@/components/ui/button';
// import { useDmpManagerZones } from '@/lib/stores/zones/dmpManagerZonesStore'; // Removed
import { useRoleData } from '@/lib/stores/roleActionsStore'; // Import consolidated hook

interface ZoneStatusActionsProps {
    zoneId: string;
    currentStatus: ZoneStatus | string;
    // onStatusChange: (zoneId: string, newStatus: ZoneStatus) => Promise<void>; // REMOVED
    // isDisabled?: boolean; // REMOVED
    className?: string;
}

export function ZoneStatusActions({ zoneId, currentStatus }: ZoneStatusActionsProps) {
    const { isLoading, changeZoneStatus } = useRoleData('dmp'); // Use consolidated hook for DMP role

    const normalizedStatus =
        typeof currentStatus === 'string' && currentStatus in ZoneStatus
            ? (currentStatus as ZoneStatus)
            : ZoneStatus.UNAVAILABLE;

    // Wrapper to handle potential missing action
    const handleChangeStatus = async (newStatus: ZoneStatus) => {
        if (changeZoneStatus) {
            await changeZoneStatus(zoneId, newStatus);
        } else {
            console.error('changeZoneStatus action is not available in the store.');
        }
    };

    return (
        <div className={`flex flex-col space-y-1 mb-6`}>
            <Button
                onClick={() => handleChangeStatus(ZoneStatus.AVAILABLE)}
                disabled={normalizedStatus === ZoneStatus.AVAILABLE || isLoading} // Use isLoading from store
                variant="ghost"
                size="sm"
                className={`text-xs px-2 py-1 h-auto ${
                    normalizedStatus === ZoneStatus.AVAILABLE || isLoading // Use isLoading from store
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
            >
                Доступна
            </Button>
            <Button
                onClick={() => handleChangeStatus(ZoneStatus.BOOKED)}
                disabled={normalizedStatus === ZoneStatus.BOOKED || isLoading} // Use isLoading from store
                variant="ghost"
                size="sm"
                className={`text-xs px-2 py-1 h-auto ${
                    normalizedStatus === ZoneStatus.BOOKED || isLoading // Use isLoading from store
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
            >
                Забронирована
            </Button>
            <Button
                onClick={() => handleChangeStatus(ZoneStatus.UNAVAILABLE)}
                disabled={normalizedStatus === ZoneStatus.UNAVAILABLE || isLoading} // Use isLoading from store
                variant="ghost"
                size="sm"
                className={`text-xs px-2 py-1 h-auto ${
                    normalizedStatus === ZoneStatus.UNAVAILABLE || isLoading // Use isLoading from store
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
            >
                Недоступна
            </Button>
        </div>
    );
}
