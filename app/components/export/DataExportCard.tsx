'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLoaderStore } from '@/lib/stores/loaderStore'; // Correct import
import { useToast } from '@/components/ui/use-toast';
// Removed unused RadioGroup, RadioGroupItem, Label imports
import { Calendar } from 'lucide-react';

export function DataExportCard() {
    // Export type is fixed to 'bookings', variable removed as it's directly used in URL
    // const exportType = 'bookings'; // Removed unused variable
    const [filename, setFilename] = useState<string>(
        `export-bookings-${new Date().toISOString().slice(0, 10)}`, // Default filename for bookings
    );
    // Removed incorrect useLoader hook
    const { toast } = useToast();

    const handleExport = async () => {
        try {
            useLoaderStore.setState({
                isLoading: true,
                message: `Экспорт бронирований...`, // Fixed message
            });

            // Конструируем URL для экспорта
            // Type is fixed, filename is handled by Content-Disposition header
            const url = `/api/db/export?type=bookings`;

            const response = await fetch(url);

            if (!response.ok) {
                // Try to get error message from response body if possible
                let errorMsg = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {
                    // Ignore if response is not JSON
                }
                throw new Error(errorMsg);
            }

            // Get filename from Content-Disposition header if available, otherwise use state
            const disposition = response.headers.get('content-disposition');
            let downloadFilename = `${filename}.xlsx`; // Default filename
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    downloadFilename = matches[1].replace(/['"]/g, '');
                }
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', downloadFilename); // Use determined filename
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

            toast({
                title: 'Экспорт завершен',
                description: `Файл ${downloadFilename} скачан.`,
                variant: 'default',
            });
        } catch (error) {
            console.error('Export error:', error); // Log the actual error
            toast({
                title: 'Ошибка экспорта',
                description:
                    error instanceof Error ? error.message : 'Произошла ошибка при экспорте данных',
                variant: 'destructive',
            });
        } finally {
            useLoaderStore.setState({ isLoading: false, message: null });
        }
    };

    // Removed getExportTypeLabel, generateDefaultFilename, handleExportTypeChange as type is fixed

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Экспорт данных
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Removed RadioGroup for export type selection */}
                    <div>
                        <h3 className="mb-2 font-medium">Тип экспорта:</h3>
                        <p className="text-sm text-gray-700">
                            Бронирования (единственный доступный тип)
                        </p>
                    </div>

                    <div>
                        <h3 className="mb-2 font-medium">Имя файла:</h3>
                        <div className="flex items-center space-x-2">
                            <Input
                                value={filename}
                                onChange={e => setFilename(e.target.value)}
                                placeholder="Введите имя файла"
                                className="flex-1"
                            />
                            <span className="text-sm text-gray-500">.xlsx</span>
                        </div>
                    </div>

                    <Button
                        onClick={handleExport}
                        className="w-full"
                    >
                        Экспортировать бронирования
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
