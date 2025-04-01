'use client';

import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface ZoneSelectedFiltersProps {
    filters: Partial<Record<string, string[]>>; // Use string as key type
    labels: Partial<Record<string, string>>; // Use string as key type
    onRemove: (type: string, value: string) => void; // Use string as key type
    className?: string;
}

export function ZoneSelectedFilters({
    filters,
    labels,
    onRemove,
    className = '',
}: ZoneSelectedFiltersProps) {
    // Filter out empty or non-array filter values directly from the prop
    const filtersToShow = Object.entries(filters).filter(
        ([, values]) => Array.isArray(values) && values.length > 0,
    ) as [string, string[]][]; // Use string as key type

    // Check if there are any selected filters to display
    const hasFilters = filtersToShow.length > 0;

    if (!hasFilters) {
        return null;
    }

    // Handle removing a specific filter value by calling the passed onRemove function
    const handleRemove = (type: string, valueToRemove: string) => {
        // Use string as key type
        onRemove(type, valueToRemove); // Call the prop function
    };

    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {/* Iterate over the filtered entries */}
            {filtersToShow.map(([type, values]) =>
                values.map(value => (
                    <Badge
                        key={`${type}-${value}`}
                        variant="secondary"
                        className="flex items-center gap-1 px-2 py-1"
                    >
                        <span className="text-xs font-medium">
                            {/* Use label from props, fallback to type */}
                            {labels[type] || type}: {value}
                        </span>
                        <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleRemove(type, value)}
                            aria-label={`Удалить фильтр ${labels[type] || type}: ${value}`}
                        />
                    </Badge>
                )),
            )}
        </div>
    );
}
