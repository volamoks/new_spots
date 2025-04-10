'use client';

import React from 'react';
import { Zone, ZoneStatus } from '@/types/zone';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ZoneStatusBadge } from './ZoneStatusBadge';
import { ZoneStatusActions } from './ZoneStatusActions';
// import { useSession } from 'next-auth/react'; // Removed useSession
import { EditableSupplierCell } from './EditableSupplierCell';
import { EditableBrandCell } from './EditableBrandCell';
// import { useDmpManagerZones } from '@/lib/stores/zones/dmpManagerZonesStore'; // Removed
import { useRoleData } from '@/lib/stores/roleActionsStore'; // Import consolidated hook

import { Role } from '@prisma/client'; // Import Role enum

interface ZonesTableRowProps {
    zone: Zone;
    userRole?: Role; // Add userRole prop
    showSelectionColumn: boolean;
    showStatusActions: boolean;
    onUpdateZoneField?: (
        zoneId: string,
        field: 'supplier' | 'brand' | 'category', // Added 'category'
        value: string | null,
    ) => Promise<boolean>;
}

export function ZonesTableRow({
    zone,
    userRole, // Destructure userRole
    showSelectionColumn,
    showStatusActions,
    onUpdateZoneField,
}: ZonesTableRowProps) {
    const isDmpManager = userRole === Role.DMP_MANAGER;
    const isCategoryManager = userRole === Role.CATEGORY_MANAGER;
    // --- Get state from store ---
    const { isLoading, selectedZoneIds, toggleZoneSelection } = useRoleData('dmp'); // Use consolidated hook
    const isSelected = selectedZoneIds.has(zone.id);
    // Session logic removed, using userRole prop now

    const handleSelect = () => {
        if (showSelectionColumn && (isDmpManager || zone.status === ZoneStatus.AVAILABLE)) {
            toggleZoneSelection(zone.id); // Use store action
        }
    };

    const handleCheckboxChange = () => {
        toggleZoneSelection(zone.id); // Use store action
    };

    const canSelectRow =
        showSelectionColumn && (isDmpManager || zone.status === ZoneStatus.AVAILABLE);

    return (
        <TableRow
            key={zone.id}
            className={`${showSelectionColumn && isSelected ? 'bg-primary-50' : ''} ${
                canSelectRow ? 'cursor-pointer hover:bg-muted/50' : ''
            }`}
            onClick={handleSelect}
        >
            {showSelectionColumn && (
                <TableCell>
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={handleCheckboxChange}
                        // DMP manager can select any zone, others only available ones
                        disabled={!isDmpManager && zone.status !== ZoneStatus.AVAILABLE}
                        aria-label={`Выбрать зону ${zone.uniqueIdentifier}`}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent row click
                    />
                </TableCell>
            )}
            <TableCell className="font-medium">{zone.uniqueIdentifier}</TableCell>
            <TableCell>{zone.city}</TableCell>
            <TableCell>{zone.market}</TableCell>
            <TableCell>{zone.mainMacrozone}</TableCell>
            <TableCell>{zone.equipment || '-'}</TableCell>
            {/* Supplier Cell */}
            <TableCell>
                {isDmpManager && onUpdateZoneField ? (
                    <EditableSupplierCell
                        zoneId={zone.id}
                        currentValue={zone.supplier}
                        onSave={async value => {
                            await onUpdateZoneField(zone.id, 'supplier', value);
                        }}
                        isDisabled={isLoading}
                    />
                ) : (
                    zone.supplier || '-'
                )}
            </TableCell>
            {/* Brand Cell */}
            <TableCell>
                {isDmpManager && onUpdateZoneField ? (
                    <EditableBrandCell
                        zoneId={zone.id}
                        currentValue={zone.brand}
                        onSave={async value => {
                            await onUpdateZoneField(zone.id, 'brand', value);
                        }}
                        isDisabled={isLoading}
                    />
                ) : (
                    zone.brand || '-'
                )}
            </TableCell>
            {/* Price Cell (KM only) */}
            {isCategoryManager && (
                <TableCell>
                    {zone.price ? `${(zone.price / 1000000).toFixed(1)} mln UZS` : 'N/A'}
                </TableCell>
            )}
            <TableCell>
                <ZoneStatusBadge status={zone.status} />
            </TableCell>
            {showStatusActions && ( // Removed onStatusChange check here
                <TableCell>
                    <ZoneStatusActions
                        zoneId={zone.id}
                        currentStatus={zone.status}
                    />
                </TableCell>
            )}
        </TableRow>
    );
}
