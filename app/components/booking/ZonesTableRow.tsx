import React from 'react';
import { Zone } from '@/types/zone';
import { Checkbox } from '@/components/ui/checkbox';
import TableCell from '@/app/components/ui/TableCell'; // Import the new cell component

interface ZonesTableRowProps {
    zone: Zone;
    selectedZones: Set<string>; // Use a more generic name like selectedZones or selectedIds
    onZoneSelection: (uniqueIdentifier: string) => void; // Use a more generic name
}

const ZonesTableRow: React.FC<ZonesTableRowProps> = ({ zone, selectedZones, onZoneSelection }) => {
    return (
        <tr
            key={zone.id}
            className="hover:bg-gray-50"
        >
            {/* Use TableCell for consistency, remove classes from original td */}
            <TableCell>
                <Checkbox
                    checked={selectedZones.has(zone.uniqueIdentifier)}
                    onCheckedChange={() => onZoneSelection(zone.uniqueIdentifier)}
                />
            </TableCell>
            <TableCell>{zone.uniqueIdentifier}</TableCell>
            <TableCell>{zone.city}</TableCell>
            <TableCell>{zone.market}</TableCell>
            <TableCell>{zone.mainMacrozone}</TableCell>
            <TableCell>{zone.equipment}</TableCell>
            <TableCell className="text-gray-900">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Доступна
                </span>
            </TableCell>
        </tr>
    );
};

export default ZonesTableRow;
