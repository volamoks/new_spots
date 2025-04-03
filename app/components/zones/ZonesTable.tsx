'use client';

import React, { useEffect, useState } from 'react'; // Добавлен useState и React
import { useSession } from 'next-auth/react';
import { ZoneKeys } from '@/types/zone'; // ZoneStatus removed
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ZonePagination } from './ZonePagination';
import { ZonesTableHeader } from './ZonesTableHeader';
import { ZonesTableRow } from './ZonesTableRow';
import { ZoneSelectionActionsPanel } from './ZoneSelectionActionsPanel';
// import { useDmpManagerZones } from '@/lib/stores/zones/dmpManagerZonesStore'; // Removed
import { useRoleData } from '@/lib/stores/roleActionsStore'; // Import consolidated hook
// import { useSupplierStore } from '@/lib/stores/supplierStore'; // Возможно, понадобится для uniqueSuppliers, если их нет в zonesStore

// Component no longer takes props
export function ZonesTable() {
    // --- Store State and Actions ---
    const {
        zones,
        selectedZoneIds,
        sortCriteria,
        isLoading,
        // uniqueFilterValues, // Получать в дочернем компоненте
        error,
        fetchZones,
        setSortCriteria,
        toggleSelectAll,
        updateZoneField, // Action for updating supplier/brand
    } = useRoleData('dmp'); // Use consolidated hook for DMP role

    // --- Session and Role Logic ---
    const { data: session } = useSession();
    const userRole = session?.user?.role;
    // const isDmpManager = userRole === 'DMP_MANAGER'; // Можно получать в дочерних компонентах
    const isSupplier = userRole === 'SUPPLIER';
    const isCategoryManager = userRole === 'CATEGORY_MANAGER';

    // Determine visibility based on role
    // Дочерние компоненты могут сами определять видимость на основе роли
    const showSelectionColumn = isSupplier || isCategoryManager || userRole === 'DMP_MANAGER';
    const showStatusActions = isSupplier || isCategoryManager;
    // Show panel if selection is possible and user is not DMP Manager (booking logic is now internal to panel)
    const showActionsPanel = showSelectionColumn && userRole !== 'DMP_MANAGER';

    // --- Local State for Action Panel ---
    const [actionPanelSupplier, setActionPanelSupplier] = useState<string | null>(null); // Локальное состояние

    // --- Derived State ---
    const { field: sortField, direction: sortDirection } = sortCriteria;

    const areAllCurrentZonesSelected =
        zones.length > 0 && zones.every(zone => selectedZoneIds.has(zone.id));

    // --- Initial Data Fetch ---
    useEffect(() => {
        if (zones.length === 0 && !isLoading) {
            fetchZones();
        }
    }, [fetchZones, zones.length, isLoading]);

    // --- Handlers ---
    // Removed handleCreateBooking

    const handleSelectAll = (checked: boolean) => {
        toggleSelectAll(checked);
    };

    const handleSortChange = (field: ZoneKeys, direction: 'asc' | 'desc' | null) => {
        setSortCriteria({ field, direction });
    };

    // --- Calculate ColSpan ---
    let colSpan = 8; // Base columns: ID, City, Market, Macrozone, Equipment, Supplier, Brand, Status
    if (showSelectionColumn) colSpan++;
    if (showStatusActions) colSpan++;

    // --- Render Logic ---
    if (error) {
        return <div className="text-red-500 p-4">Ошибка загрузки зон: {error}</div>;
    }

    return (
        <div className={`space-y-4 mb-6`}>
            {/* Selection Actions Panel */}
            {showActionsPanel && (
                <ZoneSelectionActionsPanel
                    selectedZonesCount={selectedZoneIds.size}
                    selectedSupplier={actionPanelSupplier} // Передаем локальное состояние
                    onSelectSupplier={setActionPanelSupplier} // Передаем сеттер локального состояния
                    // onCreateBooking prop removed, handled internally by the panel now
                />
            )}

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <ZonesTableHeader
                        showSelectionColumn={showSelectionColumn}
                        areAllCurrentZonesSelected={areAllCurrentZonesSelected}
                        onSelectAll={handleSelectAll}
                        sortField={sortField as ZoneKeys | null}
                        sortDirection={sortDirection}
                        onSortChange={handleSortChange}
                        showStatusActions={showStatusActions}
                        disableSelectAll={zones.length === 0 || isLoading}
                    />
                    <TableBody>
                        {isLoading && zones.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={colSpan}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    Загрузка зон...
                                </TableCell>
                            </TableRow>
                        ) : zones.length > 0 ? (
                            zones.map(zone => (
                                <ZonesTableRow
                                    key={zone.id}
                                    zone={zone}
                                    showSelectionColumn={showSelectionColumn}
                                    showStatusActions={showStatusActions}
                                    onUpdateZoneField={updateZoneField} // OK - это action из стора
                                />
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={colSpan}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    Зоны не найдены или не соответствуют фильтрам.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <ZonePagination />
        </div>
    );
}
