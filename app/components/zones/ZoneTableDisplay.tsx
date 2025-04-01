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
// Import the Zustand store hook
import { useZonesManagementStore } from '@/lib/stores/zonesManagementStore';

export function ZoneTableDisplay() {
    // Consume Zustand store for the data needed
    const { filteredZones, originalZones } = useZonesManagementStore(state => ({
        filteredZones: state.filteredZones,
        originalZones: state.originalZones, // Get original zones for count
    }));
    const originalZoneCount = originalZones.length; // Calculate count

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
                            /* Map filtered zones from store */
                            filteredZones.map((zone: Zone) => (
                                <ZoneManagementTableRow
                                    key={zone.id}
                                    zone={zone}
                                    // onRefresh is now consumed directly in ZoneManagementTableRow from the store
                                />
                            ))
                        ) : (
                            /* Display message when no zones match filters or no zones exist */
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-center py-4 text-gray-500"
                                >
                                    {/* Use original count from store */}
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
