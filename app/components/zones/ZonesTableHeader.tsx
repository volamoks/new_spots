'use client';

import React from 'react';
import { Zone } from '@/types/zone';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

import { Role } from '@prisma/client'; // Import Role enum

interface ZonesTableHeaderProps {
    userRole?: Role; // Add userRole prop
    showSelectionColumn: boolean;
    areAllCurrentZonesSelected: boolean;
    onSelectAll: (checked: boolean) => void;
    sortField: keyof Zone | null;
    sortDirection: 'asc' | 'desc' | null;
    onSortChange?: (field: keyof Zone, direction: 'asc' | 'desc' | null) => void;
    showStatusActions: boolean;
    disableSelectAll?: boolean; // To disable checkbox if no items on page
}

export function ZonesTableHeader({
    userRole, // Destructure userRole
    showSelectionColumn,
    areAllCurrentZonesSelected,
    onSelectAll,
    sortField,
    sortDirection,
    onSortChange,
    showStatusActions,
    disableSelectAll = false,
}: ZonesTableHeaderProps) {
    const isCategoryManager = userRole === Role.CATEGORY_MANAGER;
    // Обработчик изменения сортировки
    const handleSortChange = (field: keyof Zone) => {
        if (!onSortChange) return;

        let newDirection: 'asc' | 'desc' | null = 'asc';

        if (sortField === field) {
            if (sortDirection === 'asc') {
                newDirection = 'desc';
            } else if (sortDirection === 'desc') {
                newDirection = null;
            }
        }
        onSortChange(field, newDirection);
    };

    // Функция для отображения иконки сортировки
    const getSortIcon = (field: keyof Zone) => {
        if (!onSortChange || sortField !== field) {
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        }
        if (sortDirection === 'asc') {
            return <ArrowUp className="ml-2 h-4 w-4" />;
        }
        if (sortDirection === 'desc') {
            return <ArrowDown className="ml-2 h-4 w-4" />;
        }
        // If direction is null (reset)
        return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    };

    // Функция для создания заголовка с сортировкой
    const SortableHeader = ({
        field,
        children,
        className = '',
    }: {
        field: keyof Zone;
        children: React.ReactNode;
        className?: string;
    }) => (
        <TableHead className={className}>
            <div
                className={`flex items-center ${onSortChange ? 'cursor-pointer' : ''}`}
                onClick={() => onSortChange && handleSortChange(field)}
            >
                {children}
                {getSortIcon(field)}
            </div>
        </TableHead>
    );

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
                <SortableHeader field="uniqueIdentifier">ID</SortableHeader>
                <SortableHeader field="city">Город</SortableHeader>
                <SortableHeader field="market">Магазин</SortableHeader>
                <SortableHeader field="mainMacrozone">Макрозона</SortableHeader>
                <SortableHeader field="equipment">Оборудование</SortableHeader>
                <SortableHeader field="supplier">Поставщик</SortableHeader>
                <SortableHeader field="brand">Бренд</SortableHeader>
                {isCategoryManager && <SortableHeader field="price">Цена</SortableHeader>}{' '}
                {/* Add Price header for KM */}
                <SortableHeader field="status">Статус</SortableHeader>
                {showStatusActions && <TableHead>Действия</TableHead>}
            </TableRow>
        </TableHeader>
    );
}
