'use client';

import React from 'react';
// Removed unused Zone import
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
// Removed ArrowUpDown, ArrowUp, ArrowDown import

import { Role } from '@prisma/client'; // Import Role enum

interface ZonesTableHeaderProps {
    userRole?: Role; // Add userRole prop
    showSelectionColumn: boolean;
    areAllCurrentZonesSelected: boolean;
    onSelectAll: (checked: boolean) => void;
    // Removed sortField, sortDirection, onSortChange props
    showStatusActions: boolean;
    disableSelectAll?: boolean; // To disable checkbox if no items on page
}

export function ZonesTableHeader({
    userRole, // Destructure userRole
    showSelectionColumn,
    areAllCurrentZonesSelected,
    onSelectAll,
    // Removed sortField, sortDirection, onSortChange destructuring
    showStatusActions,
    disableSelectAll = false,
}: ZonesTableHeaderProps) {
    const isCategoryManager = userRole === Role.CATEGORY_MANAGER;
    const isDmpManager = userRole === Role.DMP_MANAGER;
    // Removed handleSortChange, getSortIcon, SortableHeader component

    return (
        <TableHeader>
            <TableRow>
                {showSelectionColumn && (
                    <TableHead className="w-[50px]">
                        <Checkbox
                            checked={areAllCurrentZonesSelected}
                            onCheckedChange={onSelectAll}
                            aria-label="Выбрать все на странице"
                            disabled={disableSelectAll}
                        />
                    </TableHead>
                )}
                <TableHead>ID</TableHead>
                <TableHead>Город</TableHead>
                <TableHead>Магазин</TableHead>
                <TableHead>Макрозона</TableHead>
                <TableHead>Оборудование</TableHead>
                <TableHead>Поставщик</TableHead>
                <TableHead>Бренд</TableHead>
                {(isCategoryManager || isDmpManager) && <TableHead>Цена</TableHead>}{' '}
                {/* Add Price header for KM or DMP */}
                <TableHead>Статус</TableHead>
                {showStatusActions && <TableHead>Действия</TableHead>}
            </TableRow>
        </TableHeader>
    );
}
