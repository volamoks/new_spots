'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDmpManagerZones } from '@/lib/stores/zones/dmpManagerZonesStore';

export function ZonesSummaryCard({}) {
    const { totalCount: filteredCount } = useDmpManagerZones(); // Use totalCount as filteredCount
    const title = 'Доступные зоны для бронирования';
    const description = 'Выберите зоны для создания заявки на бронирование';

    return (
        <Card className={`mb-6 `}>
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-corporate">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                {filteredCount !== undefined && ( // Check if filteredCount is available
                    <p className="text-gray-600 mt-1">
                        Зон найдено (с учетом фильтров):{' '}
                        <span className="font-semibold">{filteredCount}</span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
