'use client';

import React, { useState } from 'react'; // Removed unused useEffect
// Removed unused ZoneKeys import
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ZonePagination } from './ZonePagination';
import { ZonesTableHeader } from './ZonesTableHeader';
import { ZonesTableRow } from './ZonesTableRow';
import { ZoneSelectionActionsPanel } from './ZoneSelectionActionsPanel';
import { useRoleData } from '@/lib/stores/roleActionsStore'; // Import consolidated hook

import { Role } from '@prisma/client'; // Import Role enum

type ZonesTableProps = {
    userRole?: Role; // Add userRole prop
};

export function ZonesTable({ userRole }: ZonesTableProps) {
    // --- Store State and Actions ---
    const {
        zones,
        selectedZoneIds,
        // Removed sortCriteria
        isLoading,
        paginationCriteria, // Get pagination state
        totalCount, // Get total count
        // uniqueFilterValues, // Получать в дочернем компоненте
        error,
        // fetchZones, // Removed unused fetchZones
        // Removed setSortCriteria
        setPaginationCriteria, // Get pagination action
        toggleSelectAll,
        updateZoneField, // Action for updating supplier/brand
    } = useRoleData('dmp'); // Use consolidated hook for DMP role

    const isSupplier = userRole === Role.SUPPLIER;
    const isCategoryManager = userRole === Role.CATEGORY_MANAGER;
    const isDmpManager = userRole === Role.DMP_MANAGER;

    // Determine visibility based on role
    // Дочерние компоненты могут сами определять видимость на основе роли
    const showSelectionColumn = isSupplier || isCategoryManager || isDmpManager;
    const showStatusActions = isSupplier || isCategoryManager; // Keep as is for now, might need adjustment later
    // Show panel if selection is possible and user is not DMP Manager
    const showActionsPanel = showSelectionColumn && !isDmpManager;

    // --- Local State for Action Panel ---
    const [actionPanelSupplier, setActionPanelSupplier] = useState<string | null>(null); // Локальное состояние

    // --- Derived State ---
    // Removed derived state for sortField and sortDirection

    const areAllCurrentZonesSelected =
        zones.length > 0 && zones.every(zone => selectedZoneIds.has(zone.id));

    const handleSelectAll = (checked: boolean) => {
        toggleSelectAll(checked);
    };

    // Removed handleSortChange handler

    // --- Calculate ColSpan ---
    // Base columns: ID, City, Market, Macrozone, Equipment, Supplier, Brand, Status = 8
    let colSpan = 8;
    if (showSelectionColumn) colSpan++; // Selection checkbox
    if (isCategoryManager || isDmpManager) colSpan++; // Price column for KM or DMP
    if (showStatusActions) colSpan++; // Status actions (Supplier/KM)

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
                        userRole={userRole} // Pass role down
                        showSelectionColumn={showSelectionColumn}
                        areAllCurrentZonesSelected={areAllCurrentZonesSelected}
                        onSelectAll={handleSelectAll}
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
                                    userRole={userRole} // Pass role down
                                    showSelectionColumn={showSelectionColumn}
                                    showStatusActions={showStatusActions}
                                    onUpdateZoneField={updateZoneField}
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
            <ZonePagination
                currentPage={paginationCriteria.currentPage}
                itemsPerPage={paginationCriteria.itemsPerPage}
                totalCount={totalCount}
                isLoading={isLoading}
                onPageChange={page => setPaginationCriteria({ currentPage: page })}
                onItemsPerPageChange={size =>
                    setPaginationCriteria({ itemsPerPage: size, currentPage: 1 })
                } // Reset to page 1 on size change
            />
        </div>
    );
}
