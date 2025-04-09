'use client';

import React, { useState } from 'react'; // Add useState
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Import Button
import { useToast } from '@/components/ui/use-toast'; // Import useToast
import { DataExportCard } from '@/app/components/export/DataExportCard';
import { ExcelUploadForm } from '@/app/components/export/dmp/ExcelUploadForm';
import { TemplateDownloadButton } from '@/app/components/export/dmp/TemplateDownloadButton';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { RefreshCcw } from 'lucide-react'; // Import an icon

export default function ExportPage() {
    const { data: session, status } = useSession();
    const { toast } = useToast();
    const [isClearingCache, setIsClearingCache] = useState(false);

    if (status === 'unauthenticated') {
        redirect('/login');
    }

    // Allow only DMP_MANAGER to access this page
    if (status === 'authenticated' && session.user.role !== 'DMP_MANAGER') {
        redirect('/'); // Redirect if not DMP_MANAGER
    }

    const handleClearCache = async () => {
        setIsClearingCache(true);
        try {
            const response = await fetch('/api/cache/clear-zones', {
                method: 'POST',
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to clear cache');
            }

            toast({
                title: 'Кэш зон очищен',
                description: data.message || 'Кэш успешно очищен.',
                variant: 'success',
            });
        } catch (error) {
            console.error('Error clearing cache:', error);
            toast({
                title: 'Ошибка очистки кэша',
                description: error instanceof Error ? error.message : 'Не удалось очистить кэш.',
                variant: 'destructive',
            });
        } finally {
            setIsClearingCache(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-corporate">
                            Экспорт и импорт данных
                        </CardTitle>
                        {/* Add description here */}
                        <CardDescription>
                            На этой странице вы можете экспортировать данные из системы или
                            импортировать новые данные (Зоны, ИНН, Бренды).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>{/* Content removed from here, handled below */}</CardContent>
                </Card>

                {/* Cache Management Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Управление кэшем</CardTitle>
                        <CardDescription>
                            Очистка кэша может потребоваться после массовых изменений данных или для
                            устранения проблем с отображением устаревшей информации.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleClearCache}
                            disabled={isClearingCache}
                            variant="outline"
                        >
                            <RefreshCcw
                                className={`mr-2 h-4 w-4 ${isClearingCache ? 'animate-spin' : ''}`}
                            />
                            {isClearingCache ? 'Очистка...' : 'Очистить кэш зон'}
                        </Button>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DataExportCard />
                    {/* Replace DataImportCard with specific components */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Импорт данных</CardTitle>
                            <CardDescription>
                                Загрузите файл Excel с данными (Зоны, ИНН Поставщиков, Бренды).
                                Убедитесь, что структура файла соответствует шаблону.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Render components without passing uploadType state */}
                            <TemplateDownloadButton uploadType={'zones'} />
                            <ExcelUploadForm />
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
