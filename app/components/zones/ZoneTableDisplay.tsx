'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Zone } from '@/types/zone';
import { ZoneManagementTableRow } from './ZoneManagementTableRow';
// Remove Zustand store import
// import { useZonesManagementStore } from '@/lib/stores/zonesManagementStore';

// Define props for the component
interface ZoneTableDisplayProps {
    originalZones: Zone[];
    filteredZones: Zone[];
    onRefresh: () => void; // Add onRefresh prop
}

export function ZoneTableDisplay({
    originalZones,
    filteredZones,
    onRefresh,
}: ZoneTableDisplayProps) {
    // Destructure props including onRefresh
    // Remove Zustand store usage
    // const { filteredZones, originalZones } = useZonesManagementStore(state => ({
    //     filteredZones: state.filteredZones,
    //     originalZones: state.originalZones, // Get original zones for count
    // }));
    const originalZoneCount = originalZones.length; // Calculate count from prop

    return (
        <>
            {/* Table display */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Город</TableHead>
                            <TableHead>Магазин</TableHead>
                            <TableHead>Макрозона</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Смена статуса</TableHead>
                            <TableHead>Удалить</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredZones.length > 0 ? (
                            /* Map filtered zones from props */
                            filteredZones.map((zone: Zone) => (
                                <ZoneManagementTableRow
                                    key={zone.id}
                                    zone={zone}
                                    onRefresh={onRefresh} // Pass onRefresh down
                                />
                            ))
                        ) : (
                            /* Display message when no zones match filters or no zones exist */
                            <TableRow>
                                <TableCell
                                    colSpan={7} // Adjusted colspan if columns change
                                    className="text-center py-4 text-gray-500"
                                >
                                    {/* Use original count from prop */}
                                    {originalZoneCount === 0
                                        ? 'Зоны не найдены'
                                        : 'Нет зон, соответствующих фильтрам'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Display count of shown zones */}
            <div className="text-sm text-gray-500">
                Показано {filteredZones.length} из {originalZoneCount} зон
            </div>
        </>
    );
}
