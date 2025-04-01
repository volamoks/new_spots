import React from 'react';
import { useBookingActionsStore } from '@/lib/stores/bookingActionsStore';
import ZonesTableRow from './ZonesTableRow'; // Import the new row component
import ZonesTableHeader from './ZonesTableHeader'; // Import the new header component
import { useDmpManagerZones } from '@/lib/stores/zones/dmpManagerZonesStore';

// Removed isLoading prop definition
// interface ZonesTableProps {
//     isLoading: boolean;
// }

// Removed isLoading prop from component signature
const ZonesTable: React.FC = () => {
    const { addSelectedZoneForCreation, removeSelectedZoneForCreation, selectedZonesForCreation } =
        useBookingActionsStore();

    // isLoading is no longer needed here, global loader handles it
    const { zones } = useDmpManagerZones();

    const handleZoneSelection = (uniqueIdentifier: string) => {
        if (selectedZonesForCreation.has(uniqueIdentifier)) {
            removeSelectedZoneForCreation(uniqueIdentifier);
        } else {
            addSelectedZoneForCreation(uniqueIdentifier);
        }
    };

    const handleSelectAll = () => {
        zones.forEach(zone => {
            if (!selectedZonesForCreation.has(zone.uniqueIdentifier)) {
                addSelectedZoneForCreation(zone.uniqueIdentifier);
            }
        });
    };

    const handleDeselectAll = () => {
        zones.forEach(zone => {
            removeSelectedZoneForCreation(zone.uniqueIdentifier);
        });
    };

    // Define number of columns for empty state
    const columnCount = 7; // Adjust based on your table header columns

    return (
        <div className="bg-white rounded-md shadow overflow-hidden mb-6">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <ZonesTableHeader
                        zones={zones}
                        selectedZones={selectedZonesForCreation}
                        onSelectAll={handleSelectAll}
                        onDeselectAll={handleDeselectAll}
                        // Removed disableActions prop
                    />
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* Removed isLoading check and loading indicator */}
                        {zones.length === 0 ? (
                            // Show "No zones" message if zones array is empty
                            <tr>
                                <td
                                    colSpan={columnCount} // Use dynamic column count
                                    className="px-3 py-4 text-center text-sm text-gray-500"
                                >
                                    Нет доступных зон
                                </td>
                            </tr>
                        ) : (
                            // Render actual zone rows when zones exist
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
