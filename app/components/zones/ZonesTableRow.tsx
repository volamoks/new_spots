'use client';

import React from 'react';
import { Zone, ZoneStatus } from '@/types/zone';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ZoneStatusBadge } from './ZoneStatusBadge';
import { ZoneStatusActions } from './ZoneStatusActions';
import { EditableSupplierCell } from './EditableSupplierCell';
import { EditableBrandCell } from './EditableBrandCell';

interface ZonesTableRowProps {
    zone: Zone;
    isSelected: boolean;
    showSelectionColumn: boolean;
    onZoneSelect: (zoneId: string) => void;
    isDmpManager: boolean;
    showStatusActions: boolean;
    onStatusChange?: (zoneId: string, newStatus: ZoneStatus) => Promise<void>;
    onUpdateZoneField?: (
        zoneId: string,
        field: 'supplier' | 'brand',
        value: string | null,
    ) => Promise<void>;
    // uniqueSuppliersFromDB?: string[]; // Removed - Cell will fetch from supplierStore
    isLoading?: boolean;
}

export function ZonesTableRow({
    zone,
    isSelected,
    showSelectionColumn,
    onZoneSelect,
    isDmpManager,
    showStatusActions,
    onStatusChange,
    onUpdateZoneField,
    // uniqueSuppliersFromDB = [], // Removed from props
    isLoading = false,
}: ZonesTableRowProps) {
    const handleSelect = () => {
        // Allow selection only if the column is shown and (it's DMP manager OR zone is available)
        if (showSelectionColumn && (isDmpManager || zone.status === ZoneStatus.AVAILABLE)) {
            onZoneSelect(zone.id);
        }
    };

    // The onCheckedChange handler receives the new checked state, not an event.
    // We just need to trigger the selection toggle for this zone.
    const handleCheckboxChange = () => {
        onZoneSelect(zone.id);
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
                        // supplierList prop removed - Cell will fetch from supplierStore
                        onSave={value => onUpdateZoneField(zone.id, 'supplier', value)}
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
                        onSave={value => onUpdateZoneField(zone.id, 'brand', value)}
                        isDisabled={isLoading}
                    />
                ) : (
                    zone.brand || '-'
                )}
            </TableCell>
            <TableCell>
                <ZoneStatusBadge status={zone.status} />
            </TableCell>
            {showStatusActions && onStatusChange && (
                <TableCell>
                    <ZoneStatusActions
                        zoneId={zone.id}
                        currentStatus={zone.status}
                        onStatusChange={onStatusChange}
                        isDisabled={isLoading}
                    />
                </TableCell>
            )}
        </TableRow>
    );
}
