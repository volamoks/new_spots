import React from 'react';
import { Role } from '@prisma/client'; // Import Role enum
import { Zone } from '@/types/zone';
import { Checkbox } from '@/components/ui/checkbox';
import TableCell from '@/app/components/ui/TableCell'; // Import the new cell component

interface ZonesTableRowProps {
    zone: Zone;
    selectedZones: Set<string>; // Use a more generic name like selectedZones or selectedIds
    onZoneSelection: (uniqueIdentifier: string) => void; // Use a more generic name
    role?: Role; // Add optional role prop
}

const ZonesTableRow: React.FC<ZonesTableRowProps> = ({
    zone,
    selectedZones,
    onZoneSelection,
    role,
}) => {
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
            <TableCell>
                {zone.market?.startsWith('Korzinka - ')
                    ? zone.market.substring('Korzinka - '.length)
                    : zone.market}
            </TableCell>
            <TableCell>{zone.mainMacrozone}</TableCell>
            <TableCell>{zone.equipment}</TableCell>
            {/* Price Cell - Conditionally render based on role */}
            {role !== 'SUPPLIER' && (
                <TableCell>
                    {zone.price && typeof zone.price === 'number'
                        ? `${(zone.price / 1000000).toFixed(1)} mln UZS`
                        : 'N/A'}
                </TableCell>
            )}
            {/* Status Cell */}
            <TableCell className="text-gray-900">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Доступна
                </span>
            </TableCell>
        </tr>
    );
};

export default ZonesTableRow;
