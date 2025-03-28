'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CheckCircle } from 'lucide-react';

interface ZoneSelectionActionsPanelProps {
    selectedZonesCount: number;
    isSupplier: boolean;
    isCategoryManager: boolean;
    selectedSupplier: string | null;
    uniqueSuppliers: string[];
    onSelectSupplier?: (supplierId: string) => void;
    onCreateBooking: () => Promise<void>;
    isLoading?: boolean;
}

export function ZoneSelectionActionsPanel({
    selectedZonesCount,
    isSupplier,
    isCategoryManager,
    selectedSupplier,
    uniqueSuppliers,
    onSelectSupplier,
    onCreateBooking,
    isLoading = false,
}: ZoneSelectionActionsPanelProps) {
    if (selectedZonesCount === 0) {
        return null; // Don't render if no zones are selected
    }

    return (
        <div className="bg-primary-50 p-4 rounded-md mb-4 border border-primary-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <p className="font-medium">Выбрано зон: {selectedZonesCount}</p>
                    <p className="text-sm text-gray-500">
                        {isSupplier
                            ? 'Выберите зоны для создания заявки на бронирование'
                            : 'Выберите зоны и поставщика для создания заявки на бронирование'}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                    {isCategoryManager && (
                        <Select
                            value={selectedSupplier || ''}
                            onValueChange={value =>
                                onSelectSupplier && onSelectSupplier(value)
                            }
                            disabled={isLoading}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Выберите поставщика" />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueSuppliers.map(supplier => (
                                    <SelectItem
                                        key={supplier}
                                        value={supplier}
                                    >
                                        {supplier}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <Button
                        onClick={onCreateBooking}
                        disabled={
                            selectedZonesCount === 0 ||
                            isLoading ||
                            (isCategoryManager && !selectedSupplier)
                        }
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Создать бронирование
                    </Button>
                </div>
            </div>
        </div>
    );
}