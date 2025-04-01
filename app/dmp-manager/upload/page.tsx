'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExcelUploadForm } from '@/app/components/dmp/ExcelUploadForm';
import { TemplateDownloadButton } from '@/app/components/dmp/TemplateDownloadButton';

export default function DMPUploadPage() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-grow container mx-auto px-4 py-8">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-corporate">
                            Загрузка данных из Excel
                        </CardTitle>
                        <CardDescription>
                            Загрузите файл Excel с данными о зонах продаж. Убедитесь, что структура
                            файла соответствует шаблону.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Button to download the template */}
                        <TemplateDownloadButton />

                        {/* The main upload form component */}
                        <ExcelUploadForm />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
