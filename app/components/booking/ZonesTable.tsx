import React from 'react';
import { Zone } from '@/types/zone';
// import { Checkbox } from '@/components/ui/checkbox'; // Removed unused import
import { useBookingActionsStore } from '@/lib/stores/bookingActionsStore';
import ZonesTableRow from './ZonesTableRow'; // Import the new row component
// import TableHeaderCell from '@/app/components/ui/TableHeaderCell'; // Removed unused import
import ZonesTableHeader from './ZonesTableHeader'; // Import the new header component

interface ZonesTableProps {
    zones: Zone[];
}

const ZonesTable: React.FC<ZonesTableProps> = ({ zones }) => {
    // Get state/actions related to zone selection for booking creation
    const { addSelectedZoneForCreation, removeSelectedZoneForCreation, selectedZonesForCreation } =
        useBookingActionsStore();

    // Update function to use new actions and Set methods
    const handleZoneSelection = (uniqueIdentifier: string) => {
        if (selectedZonesForCreation.has(uniqueIdentifier)) {
            removeSelectedZoneForCreation(uniqueIdentifier);
        } else {
            addSelectedZoneForCreation(uniqueIdentifier);
        }
    };

    // Handlers for Select All / Deselect All
    const handleSelectAll = () => {
        zones.forEach(zone => {
            if (!selectedZonesForCreation.has(zone.uniqueIdentifier)) {
                addSelectedZoneForCreation(zone.uniqueIdentifier);
            }
        });
    };

    const handleDeselectAll = () => {
        // Note: If selecting/deselecting all should only affect the *currently visible* zones,
        // this logic is correct. If it should affect *all* zones regardless of filtering/pagination,
        // a different action (like `clearSelectedZonesForCreation`) might be needed,
        // or the store might need a `setSelectedZonesForCreation` action that accepts an array/Set.
        zones.forEach(zone => {
            removeSelectedZoneForCreation(zone.uniqueIdentifier);
        });
    };

    return (
        <div className="bg-white rounded-md shadow overflow-hidden mb-6">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    {/* Replace the thead block with the new component */}
                    <ZonesTableHeader
                        zones={zones}
                        selectedZones={selectedZonesForCreation}
                        onSelectAll={handleSelectAll}
                        onDeselectAll={handleDeselectAll}
                    />
                    <tbody className="bg-white divide-y divide-gray-200">
                        {zones.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-3 py-4 text-center text-sm text-gray-500"
                                >
                                    Нет доступных зон
                                </td>
                            </tr>
                        ) : (
                            // Use the new ZonesTableRow component
                            zones.map(zone => (
                                <ZonesTableRow
                                    key={zone.id}
                                    zone={zone}
                                    selectedZones={selectedZonesForCreation} // Pass the Set
                                    onZoneSelection={handleZoneSelection} // Pass the handler function
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ZonesTable;
