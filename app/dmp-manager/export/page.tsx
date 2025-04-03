'use client';

import React from 'react'; // Remove useState
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { DataExportCard } from '@/app/components/DataExportCard';
// import { DataImportCard } from '@/app/components/DataImportCard'; // Remove generic import card
import { ExcelUploadForm } from '@/app/components/dmp/ExcelUploadForm'; // Import specific upload form
import { TemplateDownloadButton } from '@/app/components/dmp/TemplateDownloadButton'; // Import download button
// Remove RadioGroup and Label imports if no longer needed elsewhere
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function DMPManagerExportPage() {
    const { data: session, status } = useSession();

    if (status === 'unauthenticated') {
        redirect('/login');
    }

    if (session && session.user.role !== 'DMP_MANAGER') {
        redirect('/');
    }

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
