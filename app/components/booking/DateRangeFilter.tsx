import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DateRangeFilterProps {
    dateFrom: string | null | undefined;
    dateTo: string | null | undefined;
    isLoading: boolean;
    onDateChange: (type: 'dateFrom' | 'dateTo', value: string) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
    dateFrom,
    dateTo,
    isLoading,
    onDateChange,
}) => {
    // Helper to format date for input value
    const formatDateForInput = (isoDate: string | null | undefined): string => {
        if (!isoDate) return '';
        try {
            return new Date(isoDate).toISOString().split('T')[0];
        } catch (e) {
            console.error('Error formatting date:', isoDate, e);
            return '';
        }
    };

    // Helper to handle date input change and convert to ISO string
    const handleInputChange = (
        type: 'dateFrom' | 'dateTo',
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        try {
            const isoString = event.target.value ? new Date(event.target.value).toISOString() : '';
            onDateChange(type, isoString);
        } catch (e) {
            console.error('Error processing date input:', event.target.value, e);
            // Optionally reset or handle the error state
            onDateChange(type, ''); // Reset to empty on error
        }
    };

    return (
        <div className="flex w-full space-x-4">
            {/* Date From */}
            <div className="flex flex-col flex-1">
                <label className="text-sm font-medium mb-1 text-gray-700">Дата с</label>
                <div className="flex items-center">
                    <Input
                        type="date"
                        value={formatDateForInput(dateFrom)}
                        onChange={e => handleInputChange('dateFrom', e)}
                        disabled={isLoading}
                        className="w-full"
                        aria-label="Дата начала"
                    />
                    {dateFrom && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="ml-1 text-xs text-gray-500 h-8 w-8 p-0"
                            onClick={() => onDateChange('dateFrom', '')}
                            aria-label="Очистить дату начала"
                            disabled={isLoading}
                        >
                            ✕
                        </Button>
                    )}
                </div>
            </div>

            {/* Date To */}
            <div className="flex flex-col flex-1">
                <label className="text-sm font-medium mb-1 text-gray-700">Дата по</label>
                <div className="flex items-center">
                    <Input
                        type="date"
                        value={formatDateForInput(dateTo)}
                        onChange={e => handleInputChange('dateTo', e)}
                        disabled={isLoading}
                        className="w-full"
                        aria-label="Дата окончания"
                    />
                    {dateTo && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="ml-1 text-xs text-gray-500 h-8 w-8 p-0"
                            onClick={() => onDateChange('dateTo', '')}
                            aria-label="Очистить дату окончания"
                            disabled={isLoading}
                        >
                            ✕
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
