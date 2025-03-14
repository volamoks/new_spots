'use client';

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ZoneSelectedFiltersProps {
  filters: Record<string, string[]>;
  labels: Record<string, string>;
  onRemove: (type: 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier', value: string) => void;
  className?: string;
}

export function ZoneSelectedFilters({
  filters,
  labels,
  onRemove,
  className = "",
}: ZoneSelectedFiltersProps) {
  // Проверяем, есть ли выбранные фильтры
  const hasFilters = Object.values(filters).some(values => 
    Array.isArray(values) && values.length > 0
  );

  if (!hasFilters) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 mt-2 ${className}`}>
      {Object.entries(filters)
        .filter(([type]) => ['city', 'market', 'macrozone', 'equipment', 'supplier'].includes(type))
        .map(([type, values]) =>
          Array.isArray(values) ? values.map(value => (
            <Badge
              key={`${type}-${value}`}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              <span className="text-xs font-medium">
                {labels[type] || type}: {value}
              </span>
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onRemove(type as 'city' | 'market' | 'macrozone' | 'equipment' | 'supplier', value)}
              />
            </Badge>
          )) : null
        )
      }
    </div>
  );
}
