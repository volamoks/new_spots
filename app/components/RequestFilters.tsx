'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export type RequestFilterState = {
    status: string[];
    supplierName: string;
    dateFrom: string;
    dateTo: string;
};

type RequestFiltersProps = {
    onFilterChange: (filters: RequestFilterState) => void;
};

export function RequestFilters({ onFilterChange }: RequestFiltersProps) {
    const [filters, setFilters] = useState<RequestFilterState>({
        status: [],
        supplierName: '',
        dateFrom: '',
        dateTo: '',
    });

    const handleStatusChange = (value: string) => {
        let newStatus = [...filters.status];
        if (newStatus.includes(value)) {
            newStatus = newStatus.filter(s => s !== value);
        } else {
            newStatus.push(value);
        }
        handleFilterChange('status', newStatus);
    };

    const handleFilterChange = <T extends keyof RequestFilterState>(
        key: T,
        value: RequestFilterState[T],
    ) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="status">Статус</Label>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => handleStatusChange('all')}
                        >
                            Все
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleStatusChange('NEW')}
                        >
                            Новая
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleStatusChange('CLOSED')}
                        >
                            Закрыта
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="supplierName">Поставщик</Label>
                    <Input
                        id="supplierName"
                        placeholder="Введите имя поставщика"
                        value={filters.supplierName}
                        onChange={e => handleFilterChange('supplierName', e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                        <Label htmlFor="dateFrom">Дата с</Label>
                        <Input
                            id="dateFrom"
                            type="date"
                            value={filters.dateFrom}
                            onChange={e => handleFilterChange('dateFrom', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dateTo">Дата по</Label>
                        <Input
                            id="dateTo"
                            type="date"
                            value={filters.dateTo}
                            onChange={e => handleFilterChange('dateTo', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
