'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ZonesSummaryCardProps {
  totalCount: number;
  filteredCount?: number;
  title?: string;
  description?: string;
  className?: string;
}

export function ZonesSummaryCard({
  totalCount,
  filteredCount,
  title = "Управление зонами",
  description = "Просматривайте и изменяйте статусы зон в системе",
  className = "",
}: ZonesSummaryCardProps) {
  return (
    <Card className={`mb-6 ${className}`}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-corporate">
          {title}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          Всего зон в системе:{' '}
          <span className="font-semibold">{totalCount}</span>
        </p>
        {filteredCount !== undefined && filteredCount !== totalCount && (
          <p className="text-gray-600 mt-1">
            Отфильтровано:{' '}
            <span className="font-semibold">{filteredCount}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
