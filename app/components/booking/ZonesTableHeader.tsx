import React from 'react';
import { Zone } from '@/types/zone';
import { Checkbox } from '@/components/ui/checkbox';
import TableHeaderCell from '@/app/components/ui/TableHeaderCell'; // Use the reusable cell

interface ZonesTableHeaderProps {
    zones: Zone[];
    selectedZones: Set<string>;
    onSelectAll: () => void;
    onDeselectAll: () => void;
}

const ZonesTableHeader: React.FC<ZonesTableHeaderProps> = ({
    zones,
    selectedZones,
    onSelectAll,
    onDeselectAll,
}) => {
    // Ensure selectedZones is treated as a Set, default to empty Set if invalid
    const validSelectedZones = selectedZones instanceof Set ? selectedZones : new Set<string>();

    const allSelected =
        zones.length > 0 && zones.every(zone => validSelectedZones.has(zone.uniqueIdentifier));

    const handleCheckedChange = (checked: boolean | 'indeterminate') => {
        if (checked) {
            onSelectAll();
        } else {
            onDeselectAll();
        }
    };

    return (
        <thead className="bg-gray-50">
            <tr>
                <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                    <div className="flex items-center">
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={handleCheckedChange}
                            disabled={zones.length === 0}
                            className="mr-2"
                        />
                    </div>
                </th>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Город</TableHeaderCell>
                <TableHeaderCell>Магазин</TableHeaderCell>
                <TableHeaderCell>Макрозона</TableHeaderCell>
                <TableHeaderCell>Оборудование</TableHeaderCell>
                <TableHeaderCell>Цена</TableHeaderCell>
                <TableHeaderCell>Статус</TableHeaderCell>
            </tr>
        </thead>
    );
};

export default ZonesTableHeader;
