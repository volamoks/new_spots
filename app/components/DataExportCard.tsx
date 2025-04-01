'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLoaderStore } from '@/lib/stores/loaderStore'; // Correct import
import { useToast } from '@/components/ui/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';

export function DataExportCard() {
    const [exportType, setExportType] = useState<string>('all');
    const [filename, setFilename] = useState<string>(
        `export-${new Date().toISOString().slice(0, 10)}`,
    );
    // Removed incorrect useLoader hook
    const { toast } = useToast();

    const handleExport = async () => {
        try {
            useLoaderStore.setState({
                isLoading: true,
                message: `Экспорт данных (${getExportTypeLabel(exportType)})...`,
            });

            // Конструируем URL для экспорта
            const url = `/api/db/export?type=${exportType}`; // Filename handled by Content-Disposition header now

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

    // Получение понятной метки для типа экспорта
    const getExportTypeLabel = (type: string): string => {
        switch (type) {
            case 'zones':
                return 'Зоны';
            case 'bookings':
                return 'Бронирования';
            case 'all':
            default:
                return 'Все данные';
        }
    };

    // Генерация дефолтного имени файла на основе типа экспорта
    const generateDefaultFilename = (type: string): string => {
        const dateStr = new Date().toISOString().slice(0, 10);
        return `export-${type}-${dateStr}`;
    };

    // Обработчик изменения типа экспорта
    const handleExportTypeChange = (value: string) => {
        setExportType(value);
        setFilename(generateDefaultFilename(value));
    };

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
                    <div>
                        <h3 className="mb-2 font-medium">Тип экспорта:</h3>
                        <RadioGroup
                            value={exportType}
                            onValueChange={handleExportTypeChange}
                            className="flex flex-col space-y-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="all"
                                    id="all"
                                />
                                <Label htmlFor="all">Все данные</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="zones"
                                    id="zones"
                                />
                                <Label htmlFor="zones">Только зоны</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="bookings"
                                    id="bookings"
                                />
                                <Label htmlFor="bookings">Только бронирования</Label>
                            </div>
                        </RadioGroup>
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
                        Экспортировать данные
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
